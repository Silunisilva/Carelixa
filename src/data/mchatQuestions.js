/**
 * M-CHAT (Modified Checklist for Autism in Toddlers) Questions
 * 20-question screening tool for autism risk assessment
 * 
 * Risk scoring logic:
 * - Certain questions: "No" answer indicates risk
 * - Other questions: "Yes" answer indicates risk
 */

export const mchatQuestions = [
  {
    id: 1,
    text: "Does your child enjoy being swung, bounced on your knee, etc.?",
    riskAnswer: "No" // No = risk
  },
  {
    id: 2,
    text: "Does your child take an interest in other children?",
    riskAnswer: "No"
  },
  {
    id: 3,
    text: "Does your child like to climb on things, such as up stairs?",
    riskAnswer: "No"
  },
  {
    id: 4,
    text: "Does your child enjoy playing peek-a-boo/hide-and-seek?",
    riskAnswer: "No"
  },
  {
    id: 5,
    text: "Does your child ever pretend, for example, to talk on the phone or pretend to feed a doll or stuffed animal?",
    riskAnswer: "No"
  },
  {
    id: 6,
    text: "Does your child ever use his/her index finger to point, to ask for something?",
    riskAnswer: "No"
  },
  {
    id: 7,
    text: "Does your child ever use his/her index finger to point, to indicate interest in something (e.g. \"Oh look, a bird.\" - it's not just grab your hand, but points)?",
    riskAnswer: "No"
  },
  {
    id: 8,
    text: "Can your child play properly with small toys (e.g. cars or blocks) without just mouthing, fiddling, or dropping them?",
    riskAnswer: "No"
  },
  {
    id: 9,
    text: "Does your child ever bring things to show you (not to get help, but to share interest)?",
    riskAnswer: "No"
  },
  {
    id: 10,
    text: "Does your child look you in the eye for more than a few seconds at a time?",
    riskAnswer: "No"
  },
  {
    id: 11,
    text: "Does your child seem oversensitive to loud sounds (e.g. plugging ears)?",
    riskAnswer: "Yes" // Yes = risk
  },
  {
    id: 12,
    text: "Does your child smile in response to your face or your smiling at him/her?",
    riskAnswer: "No"
  },
  {
    id: 13,
    text: "Does your child imitate you? (e.g. you make a face-will your child imitate it?)",
    riskAnswer: "No"
  },
  {
    id: 14,
    text: "Does your child respond to his/her name when you call?",
    riskAnswer: "No"
  },
  {
    id: 15,
    text: "If you point at a toy across the room, does your child look at it?",
    riskAnswer: "No"
  },
  {
    id: 16,
    text: "Does your child walk?",
    riskAnswer: "No"
  },
  {
    id: 17,
    text: "Does your child look at things you are looking at?",
    riskAnswer: "No"
  },
  {
    id: 18,
    text: "Does your child make unusual finger movements near his/her face?",
    riskAnswer: "Yes"
  },
  {
    id: 19,
    text: "Does your child try to attract your attention to his/her own activity?",
    riskAnswer: "No"
  },
  {
    id: 20,
    text: "Have you ever wondered if your child is deaf?",
    riskAnswer: "Yes"
  }
];

/**
 * Calculate M-CHAT risk score
 * @param {string[]} answers - Array of "Yes", "No", or null values
 * @returns {Object} { score, riskLevel }
 */
export function calculateMCHATScore(answers) {
  let score = 0;

  answers.forEach((answer, index) => {
    if (answer === null) return; // Skip unanswered questions
    
    const question = mchatQuestions[index];
    if (question && answer === question.riskAnswer) {
      score++;
    }
  });

  let riskLevel = "Low Risk";
  let riskDetails = {};

  if (score <= 2) {
    riskLevel = "Low Risk";
    riskDetails = {
      category: "Low Risk",
      description: "Your child shows typical developmental patterns.",
      recommendation: "Continue regular developmental monitoring."
    };
  } else if (score <= 7) {
    riskLevel = "Medium Risk";
    riskDetails = {
      category: "Medium Risk",
      description: "Some developmental concerns were identified. Consider professional evaluation.",
      recommendation: "Schedule a consultation with a developmental specialist or pediatrician."
    };
  } else {
    riskLevel = "High Risk";
    riskDetails = {
      category: "High Risk",
      description: "Several developmental concerns were identified.",
      recommendation: "We strongly recommend immediate consultation with a developmental pediatrician or autism specialist."
    };
  }

  return {
    score,
    riskLevel,
    riskDetails,
    totalQuestions: mchatQuestions.length,
    answeredQuestions: answers.filter(a => a !== null).length
  };
}
