from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_babel import Babel
import sys
import os

# Add the backend directory to Python path to allow absolute imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import Config

def get_locale():
    """Determine the best match for supported languages"""
    # Check if language is specified in request headers
    lang = request.headers.get('Accept-Language', 'en')
    # Extract primary language code
    if '-' in lang:
        lang = lang.split('-')[0]
    if ',' in lang:
        lang = lang.split(',')[0]
    # Return if supported, otherwise default to English
    supported = ['en', 'hi', 'te', 'kn', 'ta']
    return lang if lang in supported else 'en'

def create_app(config_class=Config):
    """
    Application factory function
    Creates and configures the Flask application
    """
    # Initialize Flask app
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    
    # Configure Babel for i18n
    app.config['BABEL_DEFAULT_LOCALE'] = 'en'
    app.config['BABEL_SUPPORTED_LOCALES'] = ['en', 'hi', 'te', 'kn', 'ta']
    app.config['BABEL_TRANSLATION_DIRECTORIES'] = 'translations'
    
    # Initialize Babel
    babel = Babel(app, locale_selector=get_locale)
    
    # Enable CORS - Allow all origins for now to fix the issue
    # In production, you should restrict this to specific domains
    CORS(app, 
         resources={r"/*": {
             "origins": "*",
             "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], 
             "allow_headers": ["Content-Type", "Authorization", "Accept"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": False,
             "max_age": 3600
         }},
         automatic_options=True,
         always_send=True)
    
    # Register blueprints
    from app.blueprints import auth, users, patients, records, access, admin, appointments, doctors, stats, analytics
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(patients.bp)
    app.register_blueprint(doctors.bp)
    app.register_blueprint(records.bp)
    app.register_blueprint(access.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(appointments.bp)
    app.register_blueprint(stats.bp)
    app.register_blueprint(analytics.bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'BharathMedicare API is running'
        }), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Welcome to BharathMedicare API',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'users': '/api/users',
                'patients': '/api/patients',
                'records': '/api/records',
                'access': '/api/access',
                'admin': '/api/admin'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'error': 'Method not allowed for this endpoint'}), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Access forbidden'}), 403
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized access'}), 401
    
    print("✓ Flask application created successfully")
    print("✓ Blueprints registered")
    print("✓ CORS enabled with automatic OPTIONS handling")
    
    return app