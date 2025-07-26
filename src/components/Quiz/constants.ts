export const questions = [
  {
    id: "name",
    question: "What is your name?",
    type: "text",
    placeholder: "Enter your name",
    validation: (value: string) => {
      if (value.length < 3) return "Name must be at least 3 characters long";
      return "";
    }
  },
  {
    id: "contact",
    question: "What is your contact number?",
    type: "tel",
    placeholder: "Enter your contact number",
    description: "Our NutraSage will send you complementary personalized diet and exercise chart here",
    validation: (value: string) => {
      if (value.length === 0) return "Please enter your phone number";
      if (value.length < 10) return "Please enter a valid 10-digit Indian phone number";
      if (!/^[6-9]\d{9}$/.test(value)) return "Please enter a valid Indian phone number";
      return "";
    }
  },
  {
    id: "email",
    question: "What is your email address?",
    type: "email",
    placeholder: "Enter your email",
    validation: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Please enter a valid email address";
      return "";
    }
  },
  {
    id: "age",
    question: "What is your age?",
    type: "number",
    placeholder: "Enter your age",
    validation: (value: string) => {
      const age = parseInt(value);
      if (!value) return "Please enter your age";
      if (isNaN(age)) return "Please enter a valid age";
      if (age < 18) return "You must be at least 18 years old";
      if (age > 100) return "Please enter a valid age";
      return "";
    }
  },
  {
    id: "gender",
    question: "What is your gender?",
    type: "select",
    options: ["Male", "Female", "Other", "Prefer not to say"]
  },
  {
    id: "mental_stress",
    question: "How often do you feel mentally stressed or anxious?",
    type: "select",
    options: [
      "rarely",
      "occassionaly",
      "frequently",
      "almost everyday"
    ]
  },
  {
    id: "energy_levels",
    question: "How would you rate your energy levels throughout the day?",
    type: "select",
    options: [
      "High and consistent",
      "Normal but dips in afternoon",
      "Low most of the day",
      "Always tired and sluggish"
    ]
  },
  {
    id: "joint_pain",
    question: "Do you experience joint pain, bone stiffness or muscle weakness?",
    type: "select",
    options: [
      "no",
      "occassionally",
      "frequently",
      "yes, severely"
    ]
  },
  {
    id: "skin_condition",
    question: "How would you describe your skin condition most of the time?",
    type: "select",
    options: [
      "Healthy and clear",
      "Dry or flaky",
      "Oily or acne prone",
      "Sensitive or easily irritated"
    ]
  },
  {
    id: "sleep_quality",
    question: "How well do you sleep at night",
    type: "select",
    options: [
      "i sleep well and wake refreshed",
      "i fall asleep easily but often wake up in middle of the night",
      "i struggle to fall asleep",
      "i rarely get a restful sleep"
    ]
  },
  {
    id: "digestive_issues",
    question: "How often do you experience digestive issues like bloating, constipation, acidity or gas?",
    type: "select",
    options: [
      "never",
      "occassionally",
      "frequently",
      "daily"
    ]
  },
  {
    id: "physical_activity",
    question: "How physically active are you?",
    type: "select",
    options: [
      "sedentary",
      "light active (walk 1-2x/week)",
      "moderate active (exercise 3-4x/week)",
      "highly active (daily workout/physically demanding job)"
    ]
  },
  {
    id: "supplements",
    question: "Are you currently taking any health supplements?",
    type: "select",
    options: [
      "yes, daily",
      "occassionally",
      "no, but open to trying",
      "no and not interested"
    ]
  },
  {
    id: "health_conditions",
    question: "Do you have any known health condtions or allergies we should be aware of?",
    type: "select",
    options: [
      "no",
      "yes (please specify in the box)"
    ],
    hasTextArea: true,
    textAreaPlaceholder: "Please describe your health conditions or allergies..."
  },
  {
    id: "blood_test",
    question: "Have you done any blood test in past 2 months?",
    type: "select",
    options: [
      "no",
      "yes (please upload for Doctor's review)"
    ],
    hasFileUpload: true,
    acceptedFileTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png"
  }
];