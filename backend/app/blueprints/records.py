from flask import Blueprint, request, jsonify, send_file
from bson import ObjectId
from io import BytesIO
from app.models.database import get_records_collection, get_users_collection
from app.models.schemas import RecordSchema
from app.utils.auth import require_auth
from app.utils.encryption import encrypt_file_data, decrypt_file_data
from app.utils.audit import log_action

bp = Blueprint('records', __name__, url_prefix='/api/records')

@bp.route('/upload', methods=['POST'])
@require_auth
def upload_record():
    """Upload encrypted medical record"""
    try:
        # Get records collection
        records_collection = get_records_collection()
        if records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get additional data
        description = request.form.get('description', '')
        patient_id = request.form.get('patient_id', request.user['user_id'])
        
        # Verify user can upload for this patient
        if request.user['role'] == 'patient' and patient_id != request.user['user_id']:
            return jsonify({'error': 'Cannot upload for other patients'}), 403
        
        # Read file data
        file_data = file.read()
        
        # Check file size (10MB limit)
        if len(file_data) > 10 * 1024 * 1024:
            return jsonify({'error': 'File size must be less than 10MB'}), 400
        
        # Encrypt the file
        encryption_result = encrypt_file_data(file_data)
        
        if not encryption_result['success']:
            return jsonify({'error': 'Encryption failed'}), 500
        
        # Create record document
        record_doc = RecordSchema.create(
            patient_id=patient_id,
            uploaded_by=request.user['user_id'],
            file_name=file.filename,
            file_type=file.content_type or 'application/octet-stream',
            encrypted_data=encryption_result['encrypted_data'],
            encryption_metadata={'method': encryption_result['encryption_method']},
            description=description
        )
        
        # Insert into database
        result = records_collection.insert_one(record_doc)
        
        # Log the action
        log_action(request.user['user_id'], 'upload', 'record', str(result.inserted_id))
        
        return jsonify({
            'message': 'Record uploaded successfully',
            'record_id': str(result.inserted_id)
        }), 201
    
    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@bp.route('/my-records', methods=['GET'])
@require_auth
def get_my_records():
    """Get all records for the current user"""
    try:
        # Get records collection
        records_collection = get_records_collection()
        if records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        
        records = list(records_collection.find({
            'patient_id': ObjectId(user_id),
            'is_deleted': False
        }).sort('uploaded_at', -1))
        
        # Format records
        for record in records:
            record['_id'] = str(record['_id'])
            record['patient_id'] = str(record['patient_id'])
            record['uploaded_by'] = str(record['uploaded_by'])
            # Don't send encrypted data in list view
            record.pop('encrypted_data', None)
        
        return jsonify({'records': records, 'count': len(records)}), 200
    
    except Exception as e:
        print(f"Get records error: {e}")
        return jsonify({'error': 'Failed to fetch records'}), 500

@bp.route('/<record_id>', methods=['GET'])
@require_auth
def get_record(record_id):
    """Get specific record details"""
    try:
        # Get records collection
        records_collection = get_records_collection()
        if records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        record = records_collection.find_one({
            '_id': ObjectId(record_id),
            'is_deleted': False
        })
        
        if not record:
            return jsonify({'error': 'Record not found'}), 404
        
        # Check permissions
        if request.user['role'] == 'patient' and str(record['patient_id']) != request.user['user_id']:
            return jsonify({'error': 'Access denied'}), 403
        
        record['_id'] = str(record['_id'])
        record['patient_id'] = str(record['patient_id'])
        record['uploaded_by'] = str(record['uploaded_by'])
        # Don't send encrypted data
        record.pop('encrypted_data', None)
        
        # Log the action
        log_action(request.user['user_id'], 'view', 'record', record_id)
        
        return jsonify({'record': record}), 200
    
    except Exception as e:
        print(f"Get record error: {e}")
        return jsonify({'error': 'Failed to fetch record'}), 500

@bp.route('/<record_id>/download', methods=['GET'])
@require_auth
def download_record(record_id):
    """Download and decrypt record file"""
    try:
        # Get records collection
        records_collection = get_records_collection()
        if records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        record = records_collection.find_one({
            '_id': ObjectId(record_id),
            'is_deleted': False
        })
        
        if not record:
            return jsonify({'error': 'Record not found'}), 404
        
        # Check permissions
        if request.user['role'] == 'patient' and str(record['patient_id']) != request.user['user_id']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if this is an old prescription (stored as file) or new/regular record (encrypted)
        if record.get('is_prescription', False) and record.get('file_path') and not record.get('encrypted_data'):
            # OLD prescription PDF - read from file system (for backwards compatibility)
            import os
            
            file_path = record['file_path']
            print(f"📄 Attempting to download OLD prescription PDF from file: {file_path}")
            
            if not os.path.exists(file_path):
                print(f"❌ File not found: {file_path}")
                return jsonify({'error': 'Prescription file not found. This may be an old prescription that was deleted during server restart.'}), 404
            
            print(f"✅ File exists, sending: {file_path}")
            
            # Log the action
            log_action(request.user['user_id'], 'download', 'record', record_id)
            
            return send_file(
                file_path,
                download_name=record['file_name'],
                as_attachment=True,
                mimetype=record['file_type']
            )
        else:
            # NEW prescription or regular encrypted record - stored in MongoDB
            if not record.get('encrypted_data'):
                return jsonify({'error': 'Record data not found'}), 404
            
            print(f"📄 Downloading encrypted record from MongoDB: {record['file_name']}")
            
            # Decrypt file data
            decrypted_data = decrypt_file_data(record['encrypted_data'])
            
            print(f"✅ Decrypted {len(decrypted_data)} bytes, sending file")
            
            # Log the action
            log_action(request.user['user_id'], 'download', 'record', record_id)
            
            return send_file(
                BytesIO(decrypted_data),
                download_name=record['file_name'],
                as_attachment=True,
                mimetype=record['file_type']
            )
    
    except Exception as e:
        print(f"❌ Download error: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@bp.route('/patient/<patient_id>', methods=['GET'])
@require_auth
def get_patient_records(patient_id):
    """Get records for a specific patient (for doctors with permission)"""
    try:
        from app.models.database import get_access_permissions_collection
        
        records_collection = get_records_collection()
        access_collection = get_access_permissions_collection()
        
        if records_collection is None or access_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        role = request.user['role']
        
        # If patient is viewing their own records
        if role == 'patient' and patient_id == user_id:
            records = list(records_collection.find({
                'patient_id': ObjectId(patient_id),
                'is_deleted': False
            }).sort('uploaded_at', -1))
        
        # If doctor is viewing patient records
        elif role == 'doctor':
            # Check if doctor has permission to view this patient's records
            permission = access_collection.find_one({
                'doctor_id': ObjectId(user_id),
                'patient_id': ObjectId(patient_id)
            })
            
            if not permission:
                return jsonify({'error': 'You do not have permission to view this patient\'s records'}), 403
            
            records = list(records_collection.find({
                'patient_id': ObjectId(patient_id),
                'is_deleted': False
            }).sort('uploaded_at', -1))
        
        else:
            return jsonify({'error': 'Access denied'}), 403
        
        # Format records
        for record in records:
            record['_id'] = str(record['_id'])
            record['patient_id'] = str(record['patient_id'])
            record['uploaded_by'] = str(record['uploaded_by'])
            # Don't send encrypted data in list view
            record.pop('encrypted_data', None)
        
        # Log the action
        log_action(user_id, 'view_patient_records', 'record', patient_id)
        
        return jsonify({'records': records, 'count': len(records)}), 200
    
    except Exception as e:
        print(f"Get patient records error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch patient records'}), 500

@bp.route('/<record_id>', methods=['DELETE'])
@require_auth
def delete_record(record_id):
    """Soft delete a record"""
    try:
        # Get records collection
        records_collection = get_records_collection()
        if records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        record = records_collection.find_one({'_id': ObjectId(record_id)})
        
        if not record:
            return jsonify({'error': 'Record not found'}), 404
        
        # Check permissions
        if request.user['role'] == 'patient' and str(record['patient_id']) != request.user['user_id']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Soft delete
        records_collection.update_one(
            {'_id': ObjectId(record_id)},
            {'$set': {'is_deleted': True}}
        )
        
        # Log the action
        log_action(request.user['user_id'], 'delete', 'record', record_id)
        
        return jsonify({'message': 'Record deleted successfully'}), 200
    
    except Exception as e:
        print(f"Delete error: {e}")
        return jsonify({'error': 'Failed to delete record'}), 500
