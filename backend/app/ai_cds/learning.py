"""
Physician Learning System - Adapts to individual physician preferences
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from bson import ObjectId


class PhysicianLearningSystem:
    """Learns from physician feedback to personalize suggestions"""
    
    def __init__(self, db):
        self.db = db
        self._ensure_collections()
    
    def _ensure_collections(self):
        """Ensure required collections exist"""
        # Physician preferences collection
        if 'physician_preferences' not in self.db.list_collection_names():
            self.db.create_collection('physician_preferences')
        
        # CDS feedback collection
        if 'cds_feedback' not in self.db.list_collection_names():
            self.db.create_collection('cds_feedback')
    
    def record_feedback(self, 
                       physician_id: str,
                       suggestion_type: str,
                       suggestion_content: Dict,
                       action: str,
                       reason: Optional[str] = None) -> bool:
        """
        Record physician feedback on CDS suggestions
        
        Args:
            physician_id: Physician's user ID
            suggestion_type: Type of suggestion (ddx, medication, etc.)
            suggestion_content: The actual suggestion that was made
            action: 'accepted', 'dismissed', 'modified'
            reason: Optional reason for dismissal
            
        Returns:
            Success status
        """
        try:
            feedback_entry = {
                'physician_id': ObjectId(physician_id),
                'suggestion_type': suggestion_type,
                'suggestion_content': suggestion_content,
                'action': action,
                'reason': reason,
                'timestamp': datetime.utcnow()
            }
            
            self.db.cds_feedback.insert_one(feedback_entry)
            
            # Update physician preferences based on feedback
            self._update_preferences(physician_id, suggestion_type, suggestion_content, action, reason)
            
            return True
            
        except Exception as e:
            print(f"Error recording feedback: {str(e)}")
            return False
    
    def _update_preferences(self,
                           physician_id: str,
                           suggestion_type: str,
                           suggestion_content: Dict,
                           action: str,
                           reason: Optional[str]):
        """Update physician preferences based on feedback"""
        try:
            physician_oid = ObjectId(physician_id)
            
            # Get or create preference document
            prefs = self.db.physician_preferences.find_one({'physician_id': physician_oid})
            
            if not prefs:
                prefs = {
                    'physician_id': physician_oid,
                    'dismissed_suggestions': {},
                    'preferred_medications': {},
                    'preferred_tests': [],
                    'suggestion_frequency': 'normal',  # 'high', 'normal', 'low'
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            
            # Update based on action
            if action == 'dismissed':
                # Track dismissed suggestions
                if suggestion_type not in prefs['dismissed_suggestions']:
                    prefs['dismissed_suggestions'][suggestion_type] = []
                
                prefs['dismissed_suggestions'][suggestion_type].append({
                    'content': suggestion_content,
                    'reason': reason,
                    'count': 1,
                    'last_dismissed': datetime.utcnow()
                })
            
            elif action == 'accepted' and suggestion_type == 'medication':
                # Track preferred medications
                drug = suggestion_content.get('drug')
                condition = suggestion_content.get('condition')
                
                if drug and condition:
                    if condition not in prefs['preferred_medications']:
                        prefs['preferred_medications'][condition] = {}
                    
                    if drug not in prefs['preferred_medications'][condition]:
                        prefs['preferred_medications'][condition][drug] = 0
                    
                    prefs['preferred_medications'][condition][drug] += 1
            
            prefs['updated_at'] = datetime.utcnow()
            
            # Upsert preferences
            self.db.physician_preferences.update_one(
                {'physician_id': physician_oid},
                {'$set': prefs},
                upsert=True
            )
            
        except Exception as e:
            print(f"Error updating preferences: {str(e)}")
    
    def get_physician_preferences(self, physician_id: str) -> Dict[str, Any]:
        """Get physician's learned preferences"""
        try:
            prefs = self.db.physician_preferences.find_one({'physician_id': ObjectId(physician_id)})
            
            if not prefs:
                return {
                    'dismissed_suggestions': {},
                    'preferred_medications': {},
                    'preferred_tests': [],
                    'suggestion_frequency': 'normal'
                }
            
            # Convert ObjectId to string for JSON serialization
            prefs['_id'] = str(prefs['_id'])
            prefs['physician_id'] = str(prefs['physician_id'])
            
            return prefs
            
        except Exception as e:
            print(f"Error getting preferences: {str(e)}")
            return {}
    
    def filter_suggestions(self,
                          physician_id: str,
                          suggestions: List[Dict],
                          suggestion_type: str) -> List[Dict]:
        """
        Filter suggestions based on physician preferences
        
        Args:
            physician_id: Physician's user ID
            suggestions: List of suggestions to filter
            suggestion_type: Type of suggestions
            
        Returns:
            Filtered and ranked suggestions
        """
        prefs = self.get_physician_preferences(physician_id)
        
        if not prefs:
            return suggestions
        
        filtered = []
        
        for suggestion in suggestions:
            # Check if this suggestion has been repeatedly dismissed
            if self._is_repeatedly_dismissed(suggestion, suggestion_type, prefs):
                continue
            
            # Boost score if it's a preferred option
            if suggestion_type == 'medication':
                suggestion = self._boost_preferred_medication(suggestion, prefs)
            
            filtered.append(suggestion)
        
        # Adjust number of suggestions based on preference
        frequency = prefs.get('suggestion_frequency', 'normal')
        if frequency == 'low':
            filtered = filtered[:3]  # Show fewer suggestions
        elif frequency == 'high':
            filtered = filtered[:10]  # Show more suggestions
        else:
            filtered = filtered[:5]  # Normal amount
        
        return filtered
    
    def _is_repeatedly_dismissed(self, suggestion: Dict, suggestion_type: str, prefs: Dict) -> bool:
        """Check if suggestion has been repeatedly dismissed"""
        dismissed = prefs.get('dismissed_suggestions', {}).get(suggestion_type, [])
        
        # If dismissed more than 3 times, don't show again
        for dismissed_item in dismissed:
            if self._suggestions_match(suggestion, dismissed_item['content']):
                if dismissed_item.get('count', 0) > 3:
                    return True
        
        return False
    
    def _suggestions_match(self, suggestion1: Dict, suggestion2: Dict) -> bool:
        """Check if two suggestions are essentially the same"""
        # Simple matching - can be made more sophisticated
        if suggestion1.get('diagnosis') == suggestion2.get('diagnosis'):
            return True
        if suggestion1.get('drug') == suggestion2.get('drug'):
            return True
        return False
    
    def _boost_preferred_medication(self, suggestion: Dict, prefs: Dict) -> Dict:
        """Boost ranking of preferred medications"""
        drug = suggestion.get('drug')
        condition = suggestion.get('condition')
        
        if drug and condition:
            preferred = prefs.get('preferred_medications', {}).get(condition, {})
            if drug in preferred:
                # Boost confidence/ranking
                usage_count = preferred[drug]
                suggestion['preference_score'] = usage_count
                suggestion['is_preferred'] = True
        
        return suggestion
    
    def get_feedback_analytics(self, physician_id: str, days: int = 30) -> Dict[str, Any]:
        """Get analytics on physician's CDS usage and feedback"""
        try:
            from datetime import timedelta
            
            start_date = datetime.utcnow() - timedelta(days=days)
            
            feedback = list(self.db.cds_feedback.find({
                'physician_id': ObjectId(physician_id),
                'timestamp': {'$gte': start_date}
            }))
            
            total_suggestions = len(feedback)
            accepted = len([f for f in feedback if f['action'] == 'accepted'])
            dismissed = len([f for f in feedback if f['action'] == 'dismissed'])
            modified = len([f for f in feedback if f['action'] == 'modified'])
            
            acceptance_rate = (accepted / total_suggestions * 100) if total_suggestions > 0 else 0
            
            # Most common dismissal reasons
            dismissal_reasons = {}
            for f in feedback:
                if f['action'] == 'dismissed' and f.get('reason'):
                    reason = f['reason']
                    dismissal_reasons[reason] = dismissal_reasons.get(reason, 0) + 1
            
            return {
                'period_days': days,
                'total_suggestions': total_suggestions,
                'accepted': accepted,
                'dismissed': dismissed,
                'modified': modified,
                'acceptance_rate': round(acceptance_rate, 1),
                'dismissal_reasons': dismissal_reasons
            }
            
        except Exception as e:
            print(f"Error getting analytics: {str(e)}")
            return {}
