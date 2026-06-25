# 🤖 AI Model Integration Guide

## Current System Status

✅ **Weekly Progress Collection Ready**
- All 3 dashboards collecting data independently
- Firestore storing submissions (parent, teacher, doctor)
- Auto-triggers model when all 3 submit
- UI displays predictions on all dashboards

🟡 **Model Integration Point**
- Currently using MOCK predictions
- Ready for your trained model connection

---

## 📍 Where the Model is Called

**File:** [`src/services/dataService.js`](src/services/dataService.js)  
**Function:** `triggerWeeklyAIModel()` (line ~540)

```javascript
export const triggerWeeklyAIModel = async (childId, weekId) => {
  try {
    const weekDocRef = fbDoc(db, 'children', childId, 'weeklyProgress', weekId);
    const snap = await fbGetDoc(weekDocRef);
    
    if (!snap.exists()) return;
    
    const data = snap.data();
    
    // 🚀 THIS IS WHERE YOUR MODEL INTEGRATES
    const prediction = await callYourAIModel({
      childId,
      weekId,
      parentData: data.parentProgress,
      teacherData: data.teacherProgress,
      doctorData: data.doctorProgress,
    });
    
    // Store result in Firestore
    await fbUpdateDoc(weekDocRef, {
      modelPrediction: {
        score: prediction.score,
        riskLevel: prediction.riskLevel,
        insights: prediction.insights,
        generatedAt: new Date().toISOString(),
      },
      status: 'complete',
    });
  } catch (error) {
    console.error('Error triggering AI model:', error);
  }
};
```

---

## 🔌 Integration Steps

### **Step 1: Replace Mock Prediction**

Current mock code (DELETE):
```javascript
// Mock prediction - replace with your API call
const prediction = {
  score: Math.floor(Math.random() * 40) + 60, // 60-100
  riskLevel: ['Low Risk', 'Medium Risk', 'High Risk'][Math.floor(Math.random() * 3)],
  insights: [
    'Communication skills showing improvement',
    'Social interaction levels consistent',
    'Recommend continued focus on...'
  ]
};
```

### **Step 2: Connect Your API**

Replace with:
```javascript
const prediction = await fetch('YOUR_API_ENDPOINT', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer YOUR_API_KEY`
  },
  body: JSON.stringify({
    childId,
    weekId,
    parentMetrics: data.parentProgress,
    teacherMetrics: data.teacherProgress,
    doctorMetrics: data.doctorProgress,
  })
}).then(r => r.json());
```

### **Step 3: Format Response**

Your API must return:
```javascript
{
  score: 75,                          // 0-100 (percentage)
  riskLevel: "Low Risk",              // "Low Risk" | "Medium Risk" | "High Risk"
  insights: [                         // Array of string insights
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ]
}
```

---

## 📊 Input Data Format to Your Model

When the model is triggered, it receives 3 data objects:

### **Parent Progress**
```javascript
{
  meltdowns: 2,                    // Number of meltdowns
  sleep: 4,                        // 1-5 scale
  appetite: 3,                     // 1-5 scale
  highlight: "Used eye contact",   // String
  observations: "Good week...",    // String
  submittedAt: "2026-05-28T...",  // ISO timestamp
  submittedBy: "parentId"          // String ID
}
```

### **Teacher Progress**
```javascript
{
  metrics: {
    communication: 4,              // 1-5 scale
    instructions: 3,               // 1-5 scale
    focus: 4,                       // 1-5 scale
    social: 3,                      // 1-5 scale
    emotional: 4                    // 1-5 scale
  },
  notes: "Great week in class...", // String
  submittedAt: "2026-05-28T...",  // ISO timestamp
  submittedBy: "teacherId"         // String ID
}
```

### **Doctor Progress**
```javascript
{
  metrics: {
    clinical: 4,                   // 1-5 scale
    behavior: 3,                   // 1-5 scale
    development: 4,                // 1-5 scale
    recommendations: 5,            // 1-5 scale
    concerns: 2                     // 1-5 scale
  },
  notes: "Clinical assessment...", // String
  submittedAt: "2026-05-28T...",  // ISO timestamp
  submittedBy: "doctorId"          // String ID
}
```

---

## 🔄 Complete Flow Diagram

```
Parent fills form
    ↓
submitParentWeeklyProgress() → Firestore saves
    ↓
checkAndUpdateWeeklyStatus() checks: All 3 submitted?
    ↓ (NO) → Wait for others
    ↓ (YES)
triggerWeeklyAIModel() calls
    ↓
YOUR_API_ENDPOINT receives:
  {
    parentData: {...},
    teacherData: {...},
    doctorData: {...}
  }
    ↓
Your ML Model processes
    ↓
Returns: { score, riskLevel, insights }
    ↓
Stored in Firestore under modelPrediction
    ↓
WeeklyProgressStatus displays on all 3 dashboards
```

---

## 🧪 Testing the Model

### **Option 1: Test Locally**

1. Update `triggerWeeklyAIModel()` with your local model endpoint
2. Go to ParentDashboard → Home Sync → Submit form
3. Check browser console for logs (look for 🚀 emoji)
4. Check Firestore to verify prediction stored

### **Option 2: Test with Mock API**

Keep the mock implementation for now:
```javascript
// Simulates your API response
const prediction = {
  score: 75,
  riskLevel: "Low Risk",
  insights: ["Test insight 1", "Test insight 2"]
};
```

### **Option 3: Use a Third-Party Service**

- OpenAI API
- Google Vertex AI
- Hugging Face API
- Your custom ML backend

---

## 🔐 Security Notes

**Before Production:**
1. Move API_KEY to environment variables (`.env.local`)
2. Use Firebase Cloud Functions to call model (don't expose API key to client)
3. Add request signing/verification
4. Rate limit model calls
5. Add error handling and retry logic

**Recommended Pattern:**
```
Client (Dashboard)
    ↓ (Firestore update triggers)
    ↓
Cloud Function (Server-side)
    ↓ (API key protected)
    ↓
Your ML API
    ↓
Cloud Function stores result
    ↓
Client reads prediction from Firestore
```

---

## 📝 Implementation Checklist

- [ ] API endpoint ready and tested
- [ ] API returns correct format (score, riskLevel, insights)
- [ ] Update `triggerWeeklyAIModel()` with API call
- [ ] Test with local parent/teacher/doctor submissions
- [ ] Verify predictions appear on dashboards
- [ ] Check Firestore data structure
- [ ] Add error handling for API failures
- [ ] Move API key to environment variables
- [ ] (Optional) Migrate to Cloud Functions
- [ ] Monitor API response times
- [ ] Set up logging/monitoring

---

## 📞 Debugging Commands

Check if model is being called:
```javascript
// In browser console while submitting:
localStorage.setItem('debugMode', 'true');

// Look for console logs with 🚀 emoji
```

Check Firestore data:
```javascript
// Firebase console:
// Navigate to: children → {childId} → weeklyProgress → {weekId}
// Should see: parentProgress, teacherProgress, doctorProgress, modelPrediction
```

---

## 🎯 Next Steps

1. **Prepare your AI model**
   - Test locally with sample data
   - Prepare API endpoint or function

2. **Get ready to integrate**
   - Copy the triggerWeeklyAIModel() code
   - Replace the mock prediction section
   - Test with one submission

3. **Deploy and monitor**
   - Watch response times
   - Monitor error rates
   - Adjust as needed

---

## 💡 Tips

- Start with a simple mock to verify flow
- Add logging at each step
- Test with edge cases (all metrics low, all metrics high)
- Consider caching predictions
- Plan for model version updates

When ready, just update the `triggerWeeklyAIModel()` function with your API integration!
