import os
import json
from groq import Groq
from typing import Dict, Any, Optional

# Initialize Groq client lazily
def get_groq_client():
    """Get or create Groq client"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")
    return Groq(api_key=api_key)


def generate_fitness_plan(
    user_goal: str,
    recovery_status: Dict[str, Any],
    lab_insights: Optional[str],
    medical_conditions: Optional[str],
    workout_history: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate a 30-day personalized workout plan using Groq AI
    
    Args:
        user_goal: The user's fitness goal (e.g., "weight_loss", "muscle_gain")
        recovery_status: Dictionary with recovery data (has_fever, has_fracture, etc.)
        lab_insights: String with lab report analysis
        medical_conditions: Pre-existing conditions from user profile
        workout_history: Optional dictionary with past workout completion data
    
    Returns:
        Dictionary containing 30-day workout plan and health priority notes
    """
    
    # Build health constraints description
    constraints = []
    health_warnings = []
    is_recovery_mode = False
    
    if recovery_status.get('is_active'):
        is_recovery_mode = True
        constraints.append(f"⚠️ Recovery Mode Active: {recovery_status.get('reason', 'Unknown')}")
        if recovery_status.get('temperature'):
            constraints.append(f"Temperature: {recovery_status['temperature']}°F")
        health_warnings.append("User is in recovery mode - prioritize rest and light activities only")
    
    if recovery_status.get('has_fracture'):
        is_recovery_mode = True
        fracture_info = recovery_status.get('fracture_details', 'fracture present')
        constraints.append(f"🦴 Fracture: {fracture_info}")
        health_warnings.append(f"Avoid exercises that stress the fracture area: {fracture_info}")
    
    if recovery_status.get('recent_surgery'):
        is_recovery_mode = True
        surgery_info = recovery_status.get('surgery_details', 'recent surgery')
        constraints.append(f"🏥 Recent Surgery: {surgery_info}")
        health_warnings.append(f"Follow post-surgery restrictions: {surgery_info}")
    
    if recovery_status.get('injury_type'):
        is_recovery_mode = True
        constraints.append(f"🤕 Injury: {recovery_status['injury_type']}")
        health_warnings.append(f"Modify exercises to accommodate injury: {recovery_status['injury_type']}")
    
    if recovery_status.get('recovery_notes'):
        constraints.append(f"📋 Doctor's Notes: {recovery_status['recovery_notes']}")
    
    # If in recovery mode, return a safe recovery plan immediately
    if is_recovery_mode:
        return create_recovery_plan(user_goal, constraints, health_warnings)
    
    # Build workout history context
    history_context = ""
    if workout_history:
        skipped_types = workout_history.get('frequently_skipped', [])
        if skipped_types:
            history_context = f"\n\nUser's Workout History:\n- Frequently skips: {', '.join(skipped_types)}\n- Consider reducing frequency or intensity of these exercise types"
    
    # Build the prompt
    prompt = f"""You are an expert fitness trainer and healthcare advisor. Generate a personalized 7-day workout plan.

USER'S GOAL: {user_goal.replace('_', ' ').title()}

HEALTH CONSTRAINTS:
{chr(10).join(constraints) if constraints else "No current health restrictions"}

LAB REPORT INSIGHTS:
{lab_insights if lab_insights else "No recent lab reports available"}

MEDICAL CONDITIONS:
{medical_conditions if medical_conditions else "None reported"}
{history_context}

CRITICAL RULES:
1. HEALTH ALWAYS TAKES PRIORITY OVER FITNESS GOALS
2. Each day should have AT LEAST 60 MINUTES (1 hour) of total exercise time
3. If user has fever, fracture, or recent surgery: ONLY suggest light stretching, breathing exercises, or rest
4. If lab parameters show deficiencies (anemia, low vitamin D, etc.): Adjust intensity but maintain 60-minute duration with lighter exercises
5. For muscle gain: Include compound exercises (push-ups, squats, lunges, planks) and progressive overload
6. For weight loss: Mix cardio and strength training
7. Include proper warm-up (5-10 min) and cool-down (5-10 min)
8. Never suggest exercises that could worsen existing conditions

OUTPUT FORMAT (JSON):
{{
    "plan_type": "recovery" | "modified" | "full",
    "priority_message": "Brief explanation if health overrides goal",
    "days": [
        {{
            "day": 1,
            "focus": "Upper Body Strength / Cardio / Full Body / etc",
            "exercises": [
                {{
                    "name": "Push-ups",
                    "type": "strength",
                    "duration_minutes": 15,
                    "sets": 3,
                    "reps": "12-15",
                    "instructions": "Keep body straight, lower chest to ground, push back up",
                    "modifications": "Knee push-ups for beginners",
                    "benefits": "Builds chest, shoulders, triceps strength"
                }}
            ],
            "notes": "Focus on form over speed"
        }}
    ],
    "weekly_summary": "Overview of the weekly progression",
    "health_priority_notes": "Explanation of how health constraints shaped this plan"
}}

Generate a complete 7-day plan with variety. Each day MUST have exercises totaling at least 60 minutes.
Include 1-2 rest or active recovery days. Make exercises realistic for home or gym."""

    try:
        # Call Groq API
        client = get_groq_client()
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert fitness trainer and medical advisor. Always prioritize health and safety over fitness goals. Provide detailed, safe, personalized workout plans in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=8000,
        )
        
        # Extract and parse response
        response_text = chat_completion.choices[0].message.content
        
        # Try to extract JSON from response
        # Sometimes the model wraps JSON in markdown code blocks
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        plan_data = json.loads(response_text)
        
        # Add metadata
        plan_data['generated_at'] = str(recovery_status)
        plan_data['health_warnings'] = health_warnings
        plan_data['goal'] = user_goal
        
        return plan_data
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response text: {response_text[:500]}")
        # Return a fallback plan
        return create_fallback_plan(user_goal, health_warnings)
    
    except Exception as e:
        print(f"Error generating fitness plan: {e}")
        return create_fallback_plan(user_goal, health_warnings)


def create_recovery_plan(goal: str, constraints: list, warnings: list) -> Dict[str, Any]:
    """Create a strict recovery plan when user has active health issues"""
    return {
        "plan_type": "recovery",
        "priority_message": f"⚠️ RECOVERY MODE ACTIVE - Your health takes priority over {goal.replace('_', ' ')} goal. Focus on healing first.",
        "days": [
            {
                "day": 1,
                "focus": "Rest & Gentle Breathing",
                "exercises": [
                    {
                        "name": "Deep Breathing Exercises",
                        "type": "flexibility",
                        "duration_minutes": 10,
                        "sets": 3,
                        "reps": "10 breaths",
                        "instructions": "Sit comfortably, breathe deeply through nose, exhale slowly through mouth",
                        "modifications": "Stop if you feel dizzy",
                        "benefits": "Promotes relaxation and oxygen flow without physical strain"
                    },
                    {
                        "name": "Light Stretching",
                        "type": "flexibility",
                        "duration_minutes": 10,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Gentle neck, shoulder, and arm stretches while seated",
                        "modifications": "Avoid any painful areas",
                        "benefits": "Maintains flexibility without stressing injury sites"
                    }
                ],
                "notes": "🩺 Rest is essential for recovery. Only do what feels comfortable."
            },
            {
                "day": 2,
                "focus": "Complete Rest",
                "exercises": [
                    {
                        "name": "Rest Day",
                        "type": "rest",
                        "duration_minutes": 0,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Focus on sleep, hydration, and nutrition",
                        "modifications": "N/A",
                        "benefits": "Allows body to heal and recover"
                    }
                ],
                "notes": "🛌 Your body needs time to heal. Rest is productive."
            },
            {
                "day": 3,
                "focus": "Light Movement",
                "exercises": [
                    {
                        "name": "Gentle Walking (if cleared by doctor)",
                        "type": "cardio",
                        "duration_minutes": 10,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Slow, comfortable pace. Stop immediately if you feel pain",
                        "modifications": "Walk indoors or stay seated if needed",
                        "benefits": "Light circulation without overexertion"
                    }
                ],
                "notes": "⚠️ Only if you feel ready. Recovery comes first."
            },
            {
                "day": 4,
                "focus": "Complete Rest",
                "exercises": [
                    {
                        "name": "Rest Day",
                        "type": "rest",
                        "duration_minutes": 0,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Focus on recovery, stay hydrated",
                        "modifications": "N/A",
                        "benefits": "Essential healing time"
                    }
                ],
                "notes": "🩺 Listen to your body's signals"
            },
            {
                "day": 5,
                "focus": "Gentle Stretching",
                "exercises": [
                    {
                        "name": "Seated Stretches",
                        "type": "flexibility",
                        "duration_minutes": 15,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Gentle stretches for unaffected body parts",
                        "modifications": "Stop if you feel any pain",
                        "benefits": "Maintains some mobility during recovery"
                    }
                ],
                "notes": "🧘 Focus on comfort, not intensity"
            },
            {
                "day": 6,
                "focus": "Complete Rest",
                "exercises": [
                    {
                        "name": "Rest Day",
                        "type": "rest",
                        "duration_minutes": 0,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Prioritize healing",
                        "modifications": "N/A",
                        "benefits": "Recovery is your primary goal"
                    }
                ],
                "notes": "💤 Rest is not laziness - it's healing"
            },
            {
                "day": 7,
                "focus": "Light Activity (Optional)",
                "exercises": [
                    {
                        "name": "Very Light Movement",
                        "type": "flexibility",
                        "duration_minutes": 10,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Only if you feel significantly better. Gentle movements only.",
                        "modifications": "Skip if still in pain",
                        "benefits": "Gradual return to activity"
                    }
                ],
                "notes": "🏥 Consult your doctor before progressing to regular workouts"
            }
        ],
        "weekly_summary": f"🏥 RECOVERY PLAN: {chr(10).join(constraints)}\n\nOnce you've recovered and cleared by your doctor, come back to set a new fitness goal. Your health is the top priority.",
        "health_priority_notes": f"This plan prioritizes your recovery over fitness goals. Health constraints: {', '.join(constraints)}",
        "health_warnings": warnings,
        "goal": goal
    }


def create_fallback_plan(goal: str, warnings: list) -> Dict[str, Any]:
    """Create a simple fallback plan if AI generation fails"""
    return {
        "plan_type": "recovery",
        "priority_message": "Unable to generate custom plan. This is a safe default recovery plan.",
        "days": [
            {
                "day": i,
                "focus": "Light Activity" if i % 2 == 1 else "Rest",
                "exercises": [
                    {
                        "name": "Gentle Walk" if i % 2 == 1 else "Rest Day",
                        "type": "cardio" if i % 2 == 1 else "rest",
                        "duration_minutes": 15 if i % 2 == 1 else 0,
                        "sets": 1,
                        "reps": "N/A",
                        "instructions": "Walk at a comfortable pace" if i % 2 == 1 else "Focus on recovery",
                        "modifications": "Stop if you feel any discomfort",
                        "benefits": "Maintains light activity while respecting health constraints"
                    }
                ],
                "notes": "Listen to your body"
            }
            for i in range(1, 8)
        ],
        "weekly_summary": "This is a gentle recovery plan. Please consult with your healthcare provider.",
        "health_priority_notes": "Plan generated with safety as top priority due to: " + ", ".join(warnings) if warnings else "Default safe plan",
        "health_warnings": warnings,
        "goal": goal
    }
