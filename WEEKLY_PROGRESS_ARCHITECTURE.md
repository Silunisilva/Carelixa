# 📊 Weekly Progress System - Complete Architecture

## 🎯 **System Overview**

This system collects weekly progress from **3 independent roles** (Parent, Teacher, Doctor) and only triggers the AI model **when ALL 3 submit**. The predictions are then visible on all 3 dashboards.

---

## 📦 **What's Been Created**

### **1. Service Layer** (`dataService.js` - NEW FUNCTIONS)

| Function | Purpose |
|----------|---------|
| `getOrCreateWeeklyProgress(childId)` | Creates new week record on Monday |
| `getWeeklyProgress(childId)` | Fetches current week's progress |
| `submitParentWeeklyProgress()` | Parent submits behavior observations |
| `submitTeacherWeeklyProgress()` | Teacher submits classroom metrics |
| `submitDoctorWeeklyProgress()` | Doctor submits clinical assessment |
| `getWeeklyProgressStatus(childId)` | Gets submission count & predictions |
| `checkAndUpdateWeeklyStatus()` | Internal: Checks all 3, triggers AI |
| `triggerWeeklyAIModel()` | Internal: Runs prediction model |

---

### **2. Components** (NEW CREATIONS)

#### **WeeklyProgressStatus.jsx** ⏱️
- **Purpose:** Progress bar + submission checklist
- **Shows:** 1/3, 2/3, 3/3 submitted status
- **Displays:** AI predictions when all 3 complete
- **Use:** On all 3 dashboards simultaneously
- **Props:** `childId`, `role` (parent/teacher/doctor)

```jsx
<WeeklyProgressStatus childId={child.id} role="teacher" />
```

---

#### **WeeklyProgressTracker.jsx** 🧠
- **Purpose:** Metric input form for Teacher & Doctor
- **Inputs:** 5 role-specific metrics (1-5 scale) + notes
- **Saves:** To Firestore weekly progress
- **Status:** Shows "Submitted" after completion
- **Props:** `child`, `role`, `customMetrics`, `onSubmit`

```jsx
<WeeklyProgressTracker
  child={selectedChild}
  role="teacher"
  customMetrics={[
    { key: 'communication', label: 'Communication' },
    // ...
  ]}
/>
```

---

#### **WeeklyParentBehaviorForm.jsx** 👨‍👩‍👧
- **Purpose:** Weekly behavior summary for Parent
- **Inputs:** Meltdowns count, sleep quality, appetite, highlight, notes
- **Saves:** To Firestore weekly progress
- **Status:** Shows "Submitted this week"
- **Props:** `child`, `parentId`, `onSubmit`

```jsx
<WeeklyParentBehaviorForm
  child={selectedChild}
  parentId={currentUser?.id}
/>
```

---

## 📁 **Firestore Data Structure**

```
children/
  {childId}/
    weeklyProgress/
      {weekId}/ (e.g., "2024-week-22")
        ├─ weekId: "2024-week-22"
        ├─ weekStartDate: "2024-05-27"
        ├─ weekEndDate: "2024-06-02"
        ├─ status: "pending" | "partial" | "complete"
        ├─ createdAt: timestamp
        │
        ├─ parentProgress:
        │   ├─ meltdowns: 2
        │   ├─ sleep: 4
        │   ├─ appetite: 3
        │   ├─ highlight: "Used eye contact"
        │   ├─ observations: "..."
        │   ├─ submittedAt: timestamp
        │   └─ submittedBy: parentId
        │
        ├─ teacherProgress:
        │   ├─ metrics:
        │   │   ├─ communication: 4
        │   │   ├─ focus: 3
        │   │   └─ ...
        │   ├─ notes: "..."
        │   ├─ submittedAt: timestamp
        │   └─ submittedBy: teacherId
        │
        ├─ doctorProgress:
        │   ├─ metrics:
        │   │   ├─ clinical: 5
        │   │   ├─ behavior: 4
        │   │   └─ ...
        │   ├─ notes: "..."
        │   ├─ submittedAt: timestamp
        │   └─ submittedBy: doctorId
        │
        └─ modelPrediction:
            ├─ score: 75
            ├─ riskLevel: "Low Risk"
            ├─ insights: ["...", "...", "..."]
            └─ generatedAt: timestamp
```

---

## 🔄 **Weekly Workflow**

### **Phase 1: Setup (Every Monday)**
```
System generates: weekId = "2024-week-22"
Creates record in Firestore
Notifies all 3 roles (via dashboard UI)
Forms become available
```

### **Phase 2: Collection (Mon-Fri)**
```
Parent submits  → parentProgress saved → status = "pending"
Teacher submits → teacherProgress saved → status = "partial"
Doctor submits  → doctorProgress saved → status = "partial"
```

### **Phase 3: Trigger (When all 3 submit)**
```
Doctor submits (3rd submission)
  ↓
checkAndUpdateWeeklyStatus() runs
  ↓
Detects: parentProgress ✓ + teacherProgress ✓ + doctorProgress ✓
  ↓
triggerWeeklyAIModel() called
  ↓
AI prediction generated
  ↓
modelPrediction stored in Firestore
  ↓
Status = "complete"
  ↓
Prediction visible on all 3 dashboards
```

### **Phase 4: Display**
```
All 3 dashboards show:
├─ Progress bar: 3/3 ✓
├─ Prediction score
├─ Risk level
├─ Key insights
└─ "Week Complete" badge
```

---

## ✅ **Behavior Matrix**

| Scenario | Parent Submits | Teacher Submits | Doctor Submits | Result |
|----------|---------------|-----------------|----------------|--------|
| Parent only | ✓ Stored | — | — | status: pending |
| Parent + Teacher | ✓ Stored | ✓ Stored | — | status: partial |
| All 3 submit | ✓ Stored | ✓ Stored | ✓ Stored | 🚀 AI Triggered |
| Duplicate submit | ❌ Error | ❌ Error | ❌ Error | "Already submitted" |

---

## 🛠️ **Implementation Checklist**

### **Step 1: Update Imports**
- [ ] Add to ParentDashboard: `WeeklyParentBehaviorForm`, `WeeklyProgressStatus`
- [ ] Add to TeacherDashboard: `WeeklyProgressTracker`, `WeeklyProgressStatus`
- [ ] Add to DoctorDashboard: `WeeklyProgressTracker`, `WeeklyProgressStatus`

### **Step 2: Replace Components**
- [ ] ParentDashboard: Replace "Daily Behavior Snapshot" with `WeeklyParentBehaviorForm`
- [ ] TeacherDashboard: Add `WeeklyProgressTracker` component
- [ ] DoctorDashboard: Add `WeeklyProgressTracker` component

### **Step 3: Add Status Display**
- [ ] Add `<WeeklyProgressStatus />` to each dashboard (preferably at top)

### **Step 4: Test**
- [ ] Parent submits → Check Firestore parent progress saved
- [ ] Teacher submits → Check status changes to "partial"
- [ ] Doctor submits → Check prediction appears
- [ ] Verify all 3 dashboards show same prediction

### **Step 5: Connect AI Model** (Optional)
- [ ] Replace mock prediction with real API call in `triggerWeeklyAIModel()`

---

## 🎯 **User Experience**

### **Parent Sees:**
```
📊 Weekly Team Progress
├─ Progress bar (1/3, 2/3, 3/3)
├─ Checklist (Parent ✓, Teacher ⏳, Doctor ⏳)
└─ Form to submit observations

After submission:
├─ "Your progress submitted! Waiting for 2 more..."
└─ (When all done) Shows prediction + insights
```

### **Teacher Sees:**
```
📊 Weekly Team Progress
├─ Progress bar (1/3, 2/3, 3/3)
├─ Checklist (Parent ✓, Teacher ⏳, Doctor ⏳)
└─ Form to submit metrics

After submission:
├─ "✓ Submitted" badge
└─ (When all done) Shows prediction + insights
```

### **Doctor Sees:**
```
Same as Teacher, but with clinical metrics
```

---

## 💡 **Key Design Principles**

✅ **Independent Submissions** - Each role submits whenever ready
✅ **Atomic Operations** - No partial data loss
✅ **Automatic Triggers** - No manual "run model" button
✅ **Duplicate Prevention** - User can't submit twice
✅ **Status Transparency** - Always show progress (1/3, 2/3, 3/3)
✅ **Real-time Sync** - Firestore keeps all dashboards in sync
✅ **Graceful Degradation** - Works even if AI model fails

---

## 🔌 **API Integration Point**

### **Current:** Mock predictions in `triggerWeeklyAIModel()`

```javascript
// In dataService.js, update this:
const triggerWeeklyAIModel = async (childId, weekId) => {
  // Currently returns mock data:
  // { score: 75, riskLevel: "Low Risk", insights: [...] }
  
  // Replace with your API:
  const prediction = await fetch('/api/predict', {
    method: 'POST',
    body: JSON.stringify({
      childId,
      weekId,
      parentData: snap.data().parentProgress,
      teacherData: snap.data().teacherProgress,
      doctorData: snap.data().doctorProgress,
    })
  }).then(r => r.json());
  
  return prediction;
};
```

---

## 📊 **Success Metrics**

- [ ] All 3 roles can submit independently
- [ ] Predictions appear when all 3 complete
- [ ] No duplicate submissions allowed
- [ ] Firestore data persists across sessions
- [ ] Status updates in real-time on all 3 dashboards
- [ ] Weekly cycle resets every Monday
- [ ] No data loss between weeks

---

## 🚀 **Future Enhancements**

- [ ] Weekly email reminders on Monday 9 AM
- [ ] Late submission warnings (Friday 5 PM)
- [ ] Historical trend analysis (week-over-week)
- [ ] Prediction confidence scoring
- [ ] Automatic remediation recommendations
- [ ] Mobile app notifications
- [ ] Export weekly report as PDF
