"""
Drug Interaction Checker - Comprehensive medication safety analysis
"""

from typing import Dict, List, Any, Optional


class DrugInteractionChecker:
    """Checks for drug-drug, drug-allergy, and drug-condition interactions"""
    
    def __init__(self):
        self._initialize_interaction_database()
    
    def _initialize_interaction_database(self):
        """Initialize comprehensive drug interaction database"""
        
        # Major drug-drug interactions
        self.drug_drug_interactions = {
            ('Warfarin', 'Aspirin'): {
                'severity': 'major',
                'mechanism': 'Additive antiplatelet effect',
                'clinical_effect': 'Significantly increased bleeding risk',
                'management': 'Avoid combination if possible. If necessary, monitor INR closely and watch for bleeding.',
                'citation': 'CHEST Guidelines on Antithrombotic Therapy'
            },
            ('Metformin', 'Contrast dye'): {
                'severity': 'major',
                'mechanism': 'Increased risk of lactic acidosis',
                'clinical_effect': 'Potentially fatal lactic acidosis',
                'management': 'Hold metformin 48 hours before and after contrast administration. Check renal function.',
                'citation': 'ACR Manual on Contrast Media v2023'
            },
            ('ACE Inhibitor', 'Potassium supplement'): {
                'severity': 'moderate',
                'mechanism': 'Decreased potassium excretion',
                'clinical_effect': 'Hyperkalemia',
                'management': 'Monitor serum potassium regularly. Consider dose adjustment.',
                'citation': 'Drug Interaction Facts'
            },
            ('Simvastatin', 'Clarithromycin'): {
                'severity': 'major',
                'mechanism': 'CYP3A4 inhibition',
                'clinical_effect': 'Increased risk of rhabdomyolysis',
                'management': 'Avoid combination. Consider alternative antibiotic or statin.',
                'citation': 'FDA Drug Safety Communication'
            }
        }
        
        # Drug-condition interactions
        self.drug_condition_interactions = {
            'Beta-blocker': {
                'Asthma': {
                    'severity': 'major',
                    'effect': 'Bronchospasm',
                    'management': 'Avoid non-selective beta-blockers. Use cardioselective if necessary.'
                },
                'Diabetes': {
                    'severity': 'moderate',
                    'effect': 'Masks hypoglycemia symptoms',
                    'management': 'Monitor blood glucose closely. Educate patient.'
                }
            },
            'NSAID': {
                'Chronic Kidney Disease': {
                    'severity': 'major',
                    'effect': 'Acute kidney injury, worsening renal function',
                    'management': 'Avoid if possible. Use lowest effective dose for shortest duration.'
                },
                'Heart Failure': {
                    'severity': 'major',
                    'effect': 'Fluid retention, worsening heart failure',
                    'management': 'Avoid. Consider alternative analgesics.'
                },
                'Hypertension': {
                    'severity': 'moderate',
                    'effect': 'Reduced antihypertensive efficacy',
                    'management': 'Monitor blood pressure. May need to adjust antihypertensive therapy.'
                }
            },
            'Metformin': {
                'Chronic Kidney Disease': {
                    'severity': 'major',
                    'effect': 'Lactic acidosis risk',
                    'management': 'Contraindicated if eGFR <30. Use caution if eGFR 30-45.'
                },
                'Liver Disease': {
                    'severity': 'major',
                    'effect': 'Lactic acidosis risk',
                    'management': 'Avoid in severe hepatic impairment.'
                }
            }
        }
        
        # Renal dosing adjustments
        self.renal_adjustments = {
            'Metformin': {
                'eGFR<30': 'Contraindicated',
                'eGFR 30-45': 'Use with caution, monitor closely',
                'eGFR>45': 'No adjustment needed'
            },
            'Gabapentin': {
                'eGFR<30': 'Reduce dose by 50-75%',
                'eGFR 30-60': 'Reduce dose by 25-50%',
                'eGFR>60': 'No adjustment needed'
            }
        }
    
    def check_all_interactions(self, 
                               new_medication: str,
                               current_medications: List[str],
                               allergies: List[str],
                               chronic_conditions: List[str],
                               renal_function: Optional[float] = None) -> Dict[str, Any]:
        """
        Comprehensive interaction check
        
        Args:
            new_medication: Medication being prescribed
            current_medications: List of current medications
            allergies: List of known allergies
            chronic_conditions: List of chronic conditions
            renal_function: eGFR value if available
            
        Returns:
            Comprehensive interaction report
        """
        report = {
            'medication': new_medication,
            'safe_to_prescribe': True,
            'drug_drug_interactions': [],
            'drug_condition_interactions': [],
            'allergy_alerts': [],
            'renal_adjustments': [],
            'warnings': [],
            'recommendations': []
        }
        
        # Check drug-drug interactions
        drug_interactions = self._check_drug_drug_interactions(new_medication, current_medications)
        if drug_interactions:
            report['drug_drug_interactions'] = drug_interactions
            if any(i['severity'] == 'major' for i in drug_interactions):
                report['safe_to_prescribe'] = False
                report['warnings'].append('Major drug-drug interaction detected')
        
        # Check drug-condition interactions
        condition_interactions = self._check_drug_condition_interactions(new_medication, chronic_conditions)
        if condition_interactions:
            report['drug_condition_interactions'] = condition_interactions
            if any(i['severity'] == 'major' for i in condition_interactions):
                report['safe_to_prescribe'] = False
                report['warnings'].append('Major drug-condition interaction detected')
        
        # Check allergies
        allergy_alerts = self._check_allergies(new_medication, allergies)
        if allergy_alerts:
            report['allergy_alerts'] = allergy_alerts
            report['safe_to_prescribe'] = False
            report['warnings'].append('ALLERGY ALERT')
        
        # Check renal adjustments
        if renal_function is not None:
            renal_adj = self._check_renal_adjustment(new_medication, renal_function)
            if renal_adj:
                report['renal_adjustments'].append(renal_adj)
                if 'Contraindicated' in renal_adj.get('recommendation', ''):
                    report['safe_to_prescribe'] = False
                    report['warnings'].append('Contraindicated in renal impairment')
        
        # Generate recommendations
        report['recommendations'] = self._generate_recommendations(report)
        
        return report
    
    def _check_drug_drug_interactions(self, new_drug: str, current_meds: List[str]) -> List[Dict]:
        """Check for drug-drug interactions"""
        interactions = []
        
        for current_med in current_meds:
            # Check both directions
            key1 = (new_drug, current_med)
            key2 = (current_med, new_drug)
            
            interaction_data = None
            if key1 in self.drug_drug_interactions:
                interaction_data = self.drug_drug_interactions[key1]
            elif key2 in self.drug_drug_interactions:
                interaction_data = self.drug_drug_interactions[key2]
            
            # Also check drug classes
            if not interaction_data:
                interaction_data = self._check_class_interactions(new_drug, current_med)
            
            if interaction_data:
                interactions.append({
                    'drug1': new_drug,
                    'drug2': current_med,
                    **interaction_data
                })
        
        return interactions
    
    def _check_class_interactions(self, drug1: str, drug2: str) -> Optional[Dict]:
        """Check for drug class interactions"""
        # Check if drugs belong to interacting classes
        drug_classes = {
            'Lisinopril': 'ACE Inhibitor',
            'Enalapril': 'ACE Inhibitor',
            'Spironolactone': 'Potassium-sparing diuretic',
            'Atorvastatin': 'Statin',
            'Simvastatin': 'Statin',
            'Clarithromycin': 'Macrolide antibiotic',
            'Erythromycin': 'Macrolide antibiotic'
        }
        
        class1 = drug_classes.get(drug1)
        class2 = drug_classes.get(drug2)
        
        if class1 == 'ACE Inhibitor' and class2 == 'Potassium-sparing diuretic':
            return {
                'severity': 'moderate',
                'mechanism': 'Both increase potassium levels',
                'clinical_effect': 'Hyperkalemia',
                'management': 'Monitor potassium levels regularly',
                'citation': 'Drug Interaction Database'
            }
        
        return None
    
    def _check_drug_condition_interactions(self, medication: str, conditions: List[str]) -> List[Dict]:
        """Check for drug-condition interactions"""
        interactions = []
        
        # Check medication class
        med_class = self._get_drug_class(medication)
        
        if med_class in self.drug_condition_interactions:
            for condition in conditions:
                if condition in self.drug_condition_interactions[med_class]:
                    interaction = self.drug_condition_interactions[med_class][condition]
                    interactions.append({
                        'medication': medication,
                        'medication_class': med_class,
                        'condition': condition,
                        **interaction
                    })
        
        return interactions
    
    def _get_drug_class(self, medication: str) -> Optional[str]:
        """Get drug class for a medication"""
        drug_class_map = {
            'Metoprolol': 'Beta-blocker',
            'Atenolol': 'Beta-blocker',
            'Ibuprofen': 'NSAID',
            'Naproxen': 'NSAID',
            'Diclofenac': 'NSAID',
            'Metformin': 'Metformin',
            'Lisinopril': 'ACE Inhibitor',
            'Enalapril': 'ACE Inhibitor'
        }
        return drug_class_map.get(medication)
    
    def _check_allergies(self, medication: str, allergies: List[str]) -> List[Dict]:
        """Check for allergy conflicts"""
        alerts = []
        
        for allergy in allergies:
            # Direct match
            if medication.lower() == allergy.lower():
                alerts.append({
                    'type': 'direct_allergy',
                    'severity': 'critical',
                    'message': f'Patient has documented allergy to {medication}',
                    'action': 'DO NOT PRESCRIBE'
                })
            
            # Cross-sensitivity (e.g., penicillin allergy)
            elif 'penicillin' in allergy.lower() and medication in ['Amoxicillin', 'Ampicillin']:
                alerts.append({
                    'type': 'cross_sensitivity',
                    'severity': 'critical',
                    'message': f'Patient allergic to penicillin. {medication} is a penicillin derivative.',
                    'action': 'DO NOT PRESCRIBE'
                })
        
        return alerts
    
    def _check_renal_adjustment(self, medication: str, egfr: float) -> Optional[Dict]:
        """Check if renal dose adjustment needed"""
        if medication in self.renal_adjustments:
            adjustments = self.renal_adjustments[medication]
            
            if egfr < 30:
                recommendation = adjustments.get('eGFR<30')
            elif egfr < 60:
                recommendation = adjustments.get('eGFR 30-60', adjustments.get('eGFR 30-45'))
            else:
                recommendation = adjustments.get('eGFR>60', adjustments.get('eGFR>45'))
            
            if recommendation and recommendation != 'No adjustment needed':
                return {
                    'medication': medication,
                    'egfr': egfr,
                    'recommendation': recommendation,
                    'citation': 'Renal Drug Handbook'
                }
        
        return None
    
    def _generate_recommendations(self, report: Dict) -> List[str]:
        """Generate actionable recommendations based on interaction report"""
        recommendations = []
        
        if not report['safe_to_prescribe']:
            recommendations.append('⚠️ Review all alerts before prescribing')
        
        if report['allergy_alerts']:
            recommendations.append('Consider alternative medication due to allergy')
        
        if report['drug_drug_interactions']:
            major_interactions = [i for i in report['drug_drug_interactions'] if i['severity'] == 'major']
            if major_interactions:
                recommendations.append('Consider alternative medication or adjust current therapy')
        
        if report['renal_adjustments']:
            recommendations.append('Adjust dose based on renal function')
        
        if not recommendations:
            recommendations.append('✓ No major safety concerns identified')
            recommendations.append('Monitor patient response and adherence')
        
        return recommendations
