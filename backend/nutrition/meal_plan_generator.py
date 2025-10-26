"""
Meal Plan Generator with Bright Data RAG Integration
Generates evidence-based meal plans using real web data
"""
import os
import json
from typing import Dict, List, Optional
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime, date
from rag.brightdata_unlocker import BrightDataClient

load_dotenv()

class MealPlanGenerator:
    """Generate personalized meal plans with RAG-verified recipes and nutrition data"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("Warning: GROQ_API_KEY not found")
        self.client = Groq(api_key=api_key) if api_key else None
    
    def _calculate_age(self, birth_date: date) -> int:
        """Calculate age from date of birth"""
        today = datetime.now().date()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    
    def _calculate_tdee(self, weight: float, height: float, age: int, gender: str, activity_level: str) -> int:
        """Calculate Total Daily Energy Expenditure"""
        # BMR using Mifflin-St Jeor
        if gender.lower() == 'male':
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        
        # Activity multipliers
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very active': 1.9
        }
        
        multiplier = activity_multipliers.get(activity_level.lower(), 1.375)
        return int(bmr * multiplier)
    
    def _build_rag_queries(self, user, lab_abnormalities: List[Dict], expectations: str) -> List[str]:
        """Build search queries for RAG based on user profile and needs"""
        queries = []
        
        # Cultural cuisine query
        if user.nationality:
            queries.append(f"healthy {user.nationality} recipes traditional cuisine")
        
        # Lab-based queries (highest priority)
        for abn in lab_abnormalities:
            parameter = abn.get('parameter', '')
            status = abn.get('status', '')
            if parameter and status:
                queries.append(f"foods to lower {parameter}" if status == 'high' else f"foods to increase {parameter}")
                queries.append(f"diet plan for {status} {parameter}")
        
        # Allergy-safe queries
        if user.food_allergies:
            allergies = user.food_allergies.replace(',', ' ')
            queries.append(f"high protein recipes without {allergies}")
        
        # Goal-based queries from expectations
        if 'bulk' in expectations.lower() or 'muscle' in expectations.lower():
            queries.append(f"high protein muscle building meal plan")
        if 'cut' in expectations.lower() or 'weight loss' in expectations.lower():
            queries.append(f"low calorie weight loss meal plan")
        if 'protein' in expectations.lower():
            queries.append(f"high protein recipes with nutrition facts")
        if 'carb' in expectations.lower() and ('low' in expectations.lower() or 'reduce' in expectations.lower()):
            queries.append(f"low carb meal ideas")
        
        # Diet type specific
        if user.diet_type:
            queries.append(f"{user.diet_type} meal plan with macros")
        
        return queries[:5]  # Limit to 5 most relevant queries
    
    def _search_recipes_and_guidelines(self, queries: List[str]) -> Dict[str, List[Dict]]:
        """Use Bright Data RAG to search for real recipes and dietary guidelines"""
        all_sources = []
        
        try:
            client = BrightDataClient()
        except Exception as e:
            print(f"Failed to initialize Bright Data client: {e}")
            return {'sources': [], 'total_sources': 0}
        
        for query in queries:
            try:
                print(f"RAG Search: {query}")
                results = client.search(query)
                
                for result in results[:3]:  # Top 3 per query
                    all_sources.append({
                        'query': query,
                        'title': result.get('title', ''),
                        'url': result.get('url', ''),
                        'snippet': result.get('text', '')[:200]
                    })
            except Exception as e:
                print(f"RAG search error for '{query}': {e}")
                continue
        
        return {
            'sources': all_sources,
            'total_sources': len(all_sources)
        }
    
    def generate_meal_plan(
        self,
        user,
        expectations: str,
        lab_abnormalities: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Generate comprehensive 7-day meal plan with RAG verification
        
        Args:
            user: User object with profile data
            expectations: User's goals/preferences (e.g., "bulk by increasing protein, reducing sugars")
            lab_abnormalities: List of lab test abnormalities from latest report
            
        Returns:
            Dict with meal plan, sources, modifications, and metadata
        """
        if not self.client:
            return {
                'error': 'AI service not configured',
                'plan_data': {},
                'sources': []
            }
        
        try:
            lab_abnormalities = lab_abnormalities or []
            
            # Calculate user's caloric needs
            age = self._calculate_age(user.date_of_birth) if user.date_of_birth else 30
            tdee = self._calculate_tdee(
                user.weight or 70,
                user.height or 170,
                age,
                user.gender or 'other',
                user.activity_level or 'moderate'
            )
            
            # Build RAG queries
            rag_queries = self._build_rag_queries(user, lab_abnormalities, expectations)
            
            # Search web for real recipes and guidelines
            print(f"Searching web for {len(rag_queries)} queries...")
            rag_results = self._search_recipes_and_guidelines(rag_queries)
            
            # Build context from RAG results
            rag_context = "\n\n=== WEB-VERIFIED INFORMATION (Use this for accuracy) ===\n"
            for source in rag_results['sources'][:8]:  # Top 8 sources
                rag_context += f"\nSource: {source['title']}\n"
                rag_context += f"Info: {source['snippet'][:200]}\n"
            
            # Build user context
            user_context = f"""
PATIENT PROFILE:
- Age: {age}, Gender: {user.gender or 'Not specified'}
- Weight: {user.weight}kg, Height: {user.height}cm
- Nationality: {user.nationality}{f', {user.state_region}' if user.state_region else ''}
- Activity Level: {user.activity_level or 'moderate'}
- Estimated TDEE: {tdee} calories/day
- Diet Type: {user.diet_type or 'Omnivore'}
- Food Allergies: {user.food_allergies or 'None'}
- Dietary Restrictions: {user.dietary_restrictions or 'None'}
- Pre-existing Conditions: {user.pre_existing_conditions or 'None'}
"""
            
            # Build lab abnormalities context
            lab_context = ""
            if lab_abnormalities:
                lab_context = "\n\n=== LAB ABNORMALITIES (HIGHEST PRIORITY - MUST ADDRESS) ===\n"
                for abn in lab_abnormalities:
                    lab_context += f"❗ {abn['parameter']}: {abn['status'].upper()} ({abn['value']})\n"
                    lab_context += f"   Normal Range: {abn.get('normal_range', 'N/A')}\n"
                    lab_context += f"   Reason: {abn.get('reason', 'Unknown')}\n"
                    lab_context += f"   Required Action: Adjust diet to normalize this parameter\n\n"
            
            # Build comprehensive prompt
            prompt = f"""{user_context}{lab_context}{rag_context}

USER'S EXPECTATIONS:
"{expectations}"

TASK: Generate a comprehensive 7-day meal plan in JSON format.

PRIORITY RULES (MUST FOLLOW):
1. LAB ABNORMALITIES = TOP PRIORITY - Must modify expectations if they conflict with lab needs
2. ALLERGIES = Second priority - Never include allergenic foods
3. USER EXPECTATIONS = Third priority - Fulfill unless conflicts with #1 or #2
4. CULTURAL PREFERENCES = Incorporate {user.nationality} cuisine whenever possible

CRITICAL INSTRUCTIONS:
- Use REAL recipes from the web-verified information provided above
- Calculate accurate macros based on actual recipe ingredients
- If expectations conflict with lab needs, prioritize lab health and explain modifications
- Include recipe names with preparation methods
- Provide realistic portion sizes
- Each day should have: Breakfast, Lunch, Dinner, 2 Snacks
- Total daily calories should be adjusted based on user goals and TDEE

Return ONLY valid JSON with this EXACT structure (no markdown, no extra text):
{{
  "days": [
    {{
      "day": 1,
      "total_calories": 2200,
      "total_protein": 150,
      "total_carbs": 200,
      "total_fats": 70,
      "meals": [
        {{
          "type": "breakfast",
          "dish_name": "Scrambled Eggs with Spinach and Whole Wheat Toast",
          "description": "3 eggs scrambled with fresh spinach, served with 2 slices whole wheat toast",
          "calories": 400,
          "protein": 30,
          "carbs": 35,
          "fats": 18,
          "preparation_notes": "Cook eggs on medium heat, add spinach at the end",
          "health_benefit": "High protein for muscle building, iron from spinach for anemia"
        }}
      ]
    }}
  ],
  "modification_notes": "Detailed explanation of how lab results affected the plan. Example: 'Your high cholesterol required us to limit red meat and focus on fish and plant proteins instead of your bulking preference for beef.'",
  "grocery_list": ["Item 1", "Item 2"],
  "meal_prep_tips": ["Tip 1", "Tip 2"]
}}

Generate the full 7-day plan now:"""

            # Call AI with RAG context
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert clinical nutritionist and registered dietitian. Generate evidence-based meal plans using the web-verified recipes and guidelines provided. Always prioritize medical lab abnormalities over user preferences. Return ONLY valid JSON without markdown code blocks."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=8000  # Increased for full 7-day plan
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean markdown if present
            if result_text.startswith('```json'):
                result_text = result_text.replace('```json', '').replace('```', '').strip()
            elif result_text.startswith('```'):
                result_text = result_text.replace('```', '').strip()
            
            # Parse JSON
            plan_data = json.loads(result_text)
            
            return {
                'plan_data': plan_data,
                'sources': rag_results['sources'],
                'total_sources': rag_results['total_sources'],
                'modification_notes': plan_data.get('modification_notes', ''),
                'user_snapshot': {
                    'age': age,
                    'weight': user.weight,
                    'height': user.height,
                    'nationality': user.nationality,
                    'allergies': user.food_allergies,
                    'tdee': tdee
                },
                'lab_considerations': lab_abnormalities
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {result_text[:500]}")
            return {
                'error': 'Failed to parse AI response as JSON',
                'raw_response': result_text[:500],
                'sources': rag_results.get('sources', [])
            }
        except Exception as e:
            print(f"Meal plan generation error: {e}")
            return {
                'error': str(e),
                'sources': []
            }
