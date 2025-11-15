from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from app.database import Database
from app.middleware import token_required, admin_required

contact_bp = Blueprint('contact', __name__)

def get_contact_collection():
    """Get contact messages collection"""
    return Database.get_collection('contact_messages')

@contact_bp.route('/submit', methods=['POST'])
def submit_contact():
    """Submit a contact form message (public endpoint)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('email') or not data.get('message'):
            return jsonify({'error': 'Name, email, and message are required'}), 400
        
        # Validate email format
        email = data.get('email', '').strip()
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        contact_collection = get_contact_collection()
        if contact_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Create contact message document
        contact_message = {
            'name': data.get('name').strip(),
            'email': email,
            'message': data.get('message').strip(),
            'status': 'unread',  # unread, read, replied
            'submitted_at': datetime.utcnow(),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'Unknown')
        }
        
        # Insert into database
        result = contact_collection.insert_one(contact_message)
        
        return jsonify({
            'message': 'Thank you for contacting us! We will get back to you soon.',
            'contact_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Contact form error: {e}")
        return jsonify({'error': 'Failed to submit contact form'}), 500


@contact_bp.route('/messages', methods=['GET'])
@token_required
@admin_required
def get_contact_messages(current_user):
    """Get all contact messages (admin only)"""
    try:
        contact_collection = get_contact_collection()
        if contact_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Get filter parameters
        status = request.args.get('status')  # unread, read, replied
        limit = int(request.args.get('limit', 100))
        
        # Build query
        query = {}
        if status:
            query['status'] = status
        
        # Fetch messages
        messages = list(contact_collection.find(query)
                       .sort('submitted_at', -1)
                       .limit(limit))
        
        # Format messages
        for msg in messages:
            msg['_id'] = str(msg['_id'])
        
        # Get counts by status
        total_count = contact_collection.count_documents({})
        unread_count = contact_collection.count_documents({'status': 'unread'})
        read_count = contact_collection.count_documents({'status': 'read'})
        replied_count = contact_collection.count_documents({'status': 'replied'})
        
        return jsonify({
            'messages': messages,
            'counts': {
                'total': total_count,
                'unread': unread_count,
                'read': read_count,
                'replied': replied_count
            }
        }), 200
        
    except Exception as e:
        print(f"Get contact messages error: {e}")
        return jsonify({'error': 'Failed to fetch contact messages'}), 500


@contact_bp.route('/messages/<message_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_message_status(current_user, message_id):
    """Update contact message status (admin only)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['unread', 'read', 'replied']:
            return jsonify({'error': 'Invalid status'}), 400
        
        contact_collection = get_contact_collection()
        if contact_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Update status
        result = contact_collection.update_one(
            {'_id': ObjectId(message_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Message not found'}), 404
        
        return jsonify({'message': 'Status updated successfully'}), 200
        
    except Exception as e:
        print(f"Update message status error: {e}")
        return jsonify({'error': 'Failed to update status'}), 500


@contact_bp.route('/messages/<message_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_message(current_user, message_id):
    """Delete a contact message (admin only)"""
    try:
        contact_collection = get_contact_collection()
        if contact_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        result = contact_collection.delete_one({'_id': ObjectId(message_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Message not found'}), 404
        
        return jsonify({'message': 'Message deleted successfully'}), 200
        
    except Exception as e:
        print(f"Delete message error: {e}")
        return jsonify({'error': 'Failed to delete message'}), 500
