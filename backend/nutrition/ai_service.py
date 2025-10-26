import os
from groq import Groq
from typing import Optional, Dict
import json
from dotenv import load_dotenv
from datetime import datetime, date

load_dotenv()

class AIService:
    """Service for AI-powered analysis using Groq (Fast & Free)"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("Warning: GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key) if api_key else None
    
    def _calculate_age(self, birth_date: date) -> int:
        """Calculate age from date of birth"""
        today = datetime.now().date()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    def _calculate_bmr(self, weight: float, height: float, age: int, gender: str) -> int:
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor equation"""
        if gender.lower() == 'male':
            return int(10 * weight + 6.25 * height - 5 * age + 5)
        else:  # female or other
            return int(10 * weight + 6.25 * height - 5 * age - 161)
    
    def _get_user_context(self, user) -> str:
        """Build comprehensive user context string for AI"""
        context_parts = []
        
        # Calculate age if DOB provided
        age = None
        if user.date_of_birth:
            age = self._calculate_age(user.date_of_birth)
            context_parts.append(f"Age: {age} years old")
        
        if user.gender:
            context_parts.append(f"Gender: {user.gender}")
        
        if user.nationality:
            nationality_info = f"Nationality: {user.nationality}"
            if user.state_region:
                nationality_info += f" (Region: {user.state_region})"
            context_parts.append(nationality_info)
        
        # Physical metrics
        if user.height and user.weight:
            bmi = user.weight / ((user.height / 100) ** 2)
            context_parts.append(f"Height: {user.height}cm, Weight: {user.weight}kg")
            context_parts.append(f"BMI: {bmi:.1f}")
            
            # Calculate BMR if we have age
            if age:
                bmr = self._calculate_bmr(user.weight, user.height, age, user.gender or 'other')
                context_parts.append(f"Estimated BMR: {bmr} calories/day")
        
        if user.blood_type:
            context_parts.append(f"Blood Type: {user.blood_type}")
        
        # Lifestyle
        if user.activity_level:
            context_parts.append(f"Activity Level: {user.activity_level}")
        
        if user.occupation_type:
            context_parts.append(f"Occupation: {user.occupation_type}")
        
        # Diet preferences
        if user.diet_type:
            context_parts.append(f"Diet Preference: {user.diet_type}")
        
        if user.food_allergies:
            context_parts.append(f"Food Allergies: {user.food_allergies}")
        
        if user.dietary_restrictions:
            context_parts.append(f"Dietary Restrictions: {user.dietary_restrictions}")
        
        if user.food_preferences:
            context_parts.append(f"Food Preferences: {user.food_preferences}")
        
        # Medical background
        if user.pre_existing_conditions:
            context_parts.append(f"Pre-existing Conditions: {user.pre_existing_conditions}")
        
        if user.current_medications:
            context_parts.append(f"Current Medications: {user.current_medications}")
        
        if user.health_goals:
            context_parts.append(f"Health Goals: {user.health_goals}")
        
        return "\n".join(context_parts)
    
    def analyze_lab_report(self, extracted_text: str, user=None) -> Dict:
        """
        Analyze lab report text using AI with user context and detailed abnormality detection
        
        Args:
            extracted_text: Text extracted from the lab report PDF
            user: User object with profile information
            
        Returns:
            Dictionary with analysis results including structured abnormalities
        """
        if not self.client:
            return {
                "summary": "AI service not configured. Please add GROQ_API_KEY to .env file.",
                "abnormalities": [],
                "key_findings": [],
                "recommendations": [],
                "risk_factors": []
            }
        
        try:
            # Build user context
            user_context = ""
            if user:
                user_context = f"\n\nPatient Profile:\n{self._get_user_context(user)}"
            
            prompt = f"""You are a medical AI assistant analyzing a lab report. Provide a detailed analysis with focus on abnormal findings.
            
Lab Report Text:
{extracted_text[:3500]}
{user_context}

Analyze this lab report and return ONLY valid JSON with this EXACT structure:
{{
  "summary": "Brief 2-3 sentence overview",
  "abnormalities": [
    {{
      "parameter": "Name of test parameter (e.g., Vitamin D)",
      "value": "Actual measured value with unit",
      "normal_range": "Normal reference range",
      "status": "high or low",
      "reason": "Detailed explanation of why this might be high/low (lifestyle, diet, medical conditions)",
      "importance": "Why this parameter is important for health",
      "risks": "Specific health risks if this remains abnormal",
      "next_test_days": 30
    }}
  ],
  "key_findings": ["Finding 1", "Finding 2"],
  "recommendations": "Detailed recommendations considering patient's profile",
  "risk_factors": "Overall health risks identified"
}}

CRITICAL RULES:
- Only include tests that are ABNORMAL (outside normal range)
- For each abnormality, provide ALL fields listed above
- status must be exactly "high" or "low"
- next_test_days should be realistic (30-90 days typically)
- Consider patient's nationality, diet, and lifestyle in reasons
- Be specific and detailed in explanations
- Return ONLY valid JSON, no additional text"""

            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",  # Fast and high rate limit
                messages=[
                    {"role": "system", "content": "You are a helpful medical AI assistant specializing in personalized lab report analysis. Consider the patient's demographic, lifestyle, and cultural background in your recommendations. Return ONLY valid JSON without markdown code blocks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1200
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith('```json'):
                result_text = result_text.replace('```json', '').replace('```', '').strip()
            elif result_text.startswith('```'):
                result_text = result_text.replace('```', '').strip()
            
            # Try to parse JSON response
            try:
                result = json.loads(result_text)
                return result
            except json.JSONDecodeError:
                # If not valid JSON, return structured fallback
                return {
                    "summary": result_text[:500],
                    "abnormalities": [],
                    "key_findings": ["Analysis completed - see summary"],
                    "recommendations": "Consult with your healthcare provider",
                    "risk_factors": ""
                }
                
        except Exception as e:
            print(f"Error in AI analysis: {e}")
            return {
                "summary": f"Analysis error: {str(e)}",
                "abnormalities": [],
                "key_findings": [],
                "recommendations": "Please consult your healthcare provider",
                "risk_factors": ""
            }
    
    def generate_meal_recommendations(self, user, lab_report=None, recent_meals=None) -> str:
        """
        Generate personalized meal recommendations based on comprehensive user profile and lab abnormalities
        
        Args:
            user: User object with complete profile
            lab_report: Optional latest lab report with abnormality findings
            recent_meals: Optional list of recent meals
            
        Returns:
            AI-generated personalized meal plan addressing deficiencies
        """
        if not self.client:
            return "AI service not configured. Please add GROQ_API_KEY to .env file."
        
        try:
            # Build comprehensive prompt
            user_context = self._get_user_context(user)
            
            # Add lab findings and abnormalities if available
            lab_context = ""
            if lab_report:
                if lab_report.ai_summary:
                    lab_context = f"\n\nLatest Lab Results Summary:\n{lab_report.ai_summary}"
                
                # Include detailed abnormalities for targeted nutrition
                if lab_report.abnormalities:
                    try:
                        abnormalities = json.loads(lab_report.abnormalities) if isinstance(lab_report.abnormalities, str) else lab_report.abnormalities
                        if abnormalities:
                            lab_context += "\n\nABNORMAL LAB FINDINGS (MUST ADDRESS IN MEAL PLAN):"
                            for abn in abnormalities:
                                lab_context += f"\n- {abn.get('parameter')}: {abn.get('status').upper()} ({abn.get('value')})"
                                lab_context += f"\n  Reason: {abn.get('reason', 'Unknown')}"
                                lab_context += f"\n  Needs: Foods to correct this deficiency/excess"
                    except:
                        pass
            
            # Add recent meals context
            meals_context = ""
            if recent_meals:
                meals_context = f"\n\nRecent Meals (last 7 days): {len(recent_meals)} meals logged"
            
            prompt = f"""Create a structured daily meal plan for this patient. Format as follows:

Patient Profile:
{user_context}
{lab_context}
{meals_context}

IMPORTANT FORMATTING RULES:
- Start with a 2-sentence summary about the patient's nutritional needs
- Then provide meals in this exact format:

BREAKFAST:
- Dish 1 (e.g., Scrambled eggs with spinach - 300 cal, 20g protein)
- Dish 2
- Beverage

LUNCH:
- Main dish
- Side dish
- Beverage

DINNER:
- Main course
- Vegetables/Salad
- Dessert (optional)

SNACKS:
- Morning snack
- Evening snack

NOTES:
- Key nutritional focus
- Foods to emphasize for lab abnormalities
- Preparation tips

REQUIREMENTS:
1. Use foods from {user.nationality}{f', {user.state_region}' if user.state_region else ''} cuisine
2. Address ALL lab abnormalities with specific foods
3. Consider: {user.diet_type}, allergies: {user.food_allergies or 'None'}, restrictions: {user.dietary_restrictions or 'None'}
4. Make it practical and delicious
5. No asterisks or markdown - plain text only"""

            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are an expert clinical nutritionist. Create structured, therapeutic meal plans that address lab abnormalities. Use plain text formatting with clear sections (BREAKFAST:, LUNCH:, etc.). No markdown symbols like **, ***, ##, or __."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=1500
            )
            
            result = response.choices[0].message.content.strip()
            
            # Remove markdown formatting
            result = result.replace('***', '')
            result = result.replace('**', '')
            result = result.replace('__', '')
            result = result.replace('# ', '')
            result = result.replace('## ', '')
            result = result.replace('### ', '')
            
            return result
            
        except Exception as e:
            print(f"Error generating meal recommendations: {e}")
            return f"Error generating recommendations: {str(e)}"

