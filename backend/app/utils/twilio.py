from twilio.rest import Client
import os
from flask import current_app

def get_twilio_client():
    """Initializes and returns the Twilio client."""
    account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
    auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
    
    if not account_sid or not auth_token:
        # CRITICAL DEBUG LOGGING
        print("!!! TWILIO CONFIGURATION ERROR !!!")
        print(f"TWILIO_ACCOUNT_SID: {account_sid}")
        print("Please check your backend/.env file and ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set.")
        raise ValueError("Twilio credentials not configured")
    
    return Client(account_sid, auth_token)

def send_otp(phone_number):
    """Sends an OTP to the specified phone number using Twilio Verify."""
    try:
        client = get_twilio_client()
        service_sid = current_app.config.get('TWILIO_VERIFY_SERVICE_SID')
        
        if not service_sid or service_sid == 'VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx':
            # CRITICAL DEBUG LOGGING
            print("!!! TWILIO SERVICE SID ERROR !!!")
            print("Please update TWILIO_VERIFY_SERVICE_SID in backend/.env with your actual Twilio Service SID.")
            raise ValueError("Twilio Verify Service SID not configured or is placeholder.")
        
        # Twilio recommends sending code via SMS
        verification = client.verify.v2.services(service_sid).verifications.create(
            to=phone_number, 
            channel='sms'
        )
        
        print(f"Twilio verification initiated: {verification.sid}, Status: {verification.status}")
        return {'success': True, 'sid': verification.sid}
    
    except Exception as e:
        print(f"Twilio send_otp fatal error: {e}")
        return {'success': False, 'error': str(e)}

def verify_otp(phone_number, code):
    """Verifies the OTP code for the specified phone number."""
    try:
        client = get_twilio_client()
        service_sid = current_app.config.get('TWILIO_VERIFY_SERVICE_SID')

        if not service_sid or service_sid == 'VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx':
            raise ValueError("Twilio Verify Service SID not configured or is placeholder.")
            
        verification_check = client.verify.v2.services(service_sid).verification_checks.create(
            to=phone_number, 
            code=code
        )
        
        # 'approved' status indicates successful verification
        is_valid = verification_check.status == 'approved'
        
        print(f"Twilio verification check: {verification_check.sid}, Status: {verification_check.status}")
        return {'success': True, 'is_valid': is_valid}
    
    except Exception as e:
        print(f"Twilio verify_otp fatal error: {e}")
        return {'success': False, 'error': str(e)}