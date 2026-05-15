// Mock data for the application

export const mockTeachers = [
  {
    id: 'teacher1',
    name: 'Ms. Jennifer Lee',
    email: 'jennifer.lee@school.edu',
    role: 'teacher',
    specialization: 'Special Education',
    phone: '+1 (555) 123-4567',
  },
  {
    id: 'teacher2',
    name: 'Mr. David Smith',
    email: 'david.smith@school.edu',
    role: 'teacher',
    specialization: 'Behavioral Therapy',
    phone: '+1 (555) 234-5678',
  },
  {
    id: 'teacher3',
    name: 'Ms. Anna Rodriguez',
    email: 'anna.rodriguez@school.edu',
    role: 'teacher',
    specialization: 'Speech & Language',
    phone: '+1 (555) 345-6789',
  },
];

export const mockDoctors = [
  {
    id: 'doctor1',
    name: 'Dr. Sarah Miller',
    email: 'sarah.miller@clinic.com',
    role: 'doctor',
    specialization: 'Developmental Pediatrics',
    phone: '+1 (555) 456-7890',
    clinic: 'Autism Care Clinic',
  },
  {
    id: 'doctor2',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@clinic.com',
    role: 'doctor',
    specialization: 'Clinical Psychology',
    phone: '+1 (555) 567-8901',
    clinic: 'Behavioral Health Center',
  },
  {
    id: 'doctor3',
    name: 'Dr. Lisa Thompson',
    email: 'lisa.thompson@clinic.com',
    role: 'doctor',
    specialization: 'Occupational Therapy',
    phone: '+1 (555) 678-9012',
    clinic: 'Autism Care Clinic',
  },
];

export const mockChildren = [
  {
    id: '1',
    name: 'Emma Johnson',
    age: 4,
    gender: 'female',
    diagnosis: 'ASD Level 1',
    enrolledDate: '2025-09-01',
    parentId: 'parent1',
    teacherId: 'teacher1',
    doctorId: 'doctor1',
    linkedTeachers: ['teacher1'],
    linkedDoctors: ['doctor1'],
  },
  {
    id: '2',
    name: 'Liam Smith',
    age: 5,
    gender: 'male',
    diagnosis: 'ASD Level 2',
    enrolledDate: '2025-10-15',
    parentId: 'parent2',
    teacherId: 'teacher1',
    doctorId: 'doctor1',
    linkedTeachers: ['teacher1'],
    linkedDoctors: ['doctor1'],
  },
  {
    id: '3',
    name: 'Olivia Brown',
    age: 3,
    gender: 'female',
    diagnosis: 'ASD Level 1',
    enrolledDate: '2026-01-05',
    parentId: 'parent3',
    teacherId: 'teacher2',
    doctorId: 'doctor2',
    linkedTeachers: ['teacher2'],
    linkedDoctors: ['doctor2'],
  },
];

export const mockDocuments = [
  {
    id: '1',
    childId: '1',
    type: 'Assessment Report',
    title: 'Initial Evaluation',
    uploadedBy: 'Dr. Sarah Miller',
    uploadedDate: '2025-09-05',
    url: '#',
  },
  {
    id: '2',
    childId: '1',
    type: 'Progress Note',
    title: 'October Progress',
    uploadedBy: 'Ms. Jennifer Lee',
    uploadedDate: '2025-10-30',
    url: '#',
  },
  {
    id: '3',
    childId: '2',
    type: 'IEP Document',
    title: 'Individual Education Plan',
    uploadedBy: 'Dr. Sarah Miller',
    uploadedDate: '2025-10-20',
    url: '#',
  },
  {
    id: '4',
    childId: '3',
    type: 'Assessment Report',
    title: 'Baseline Assessment',
    uploadedBy: 'Dr. Michael Chen',
    uploadedDate: '2026-01-08',
    url: '#',
  },
];

export const mockAIPlans = [
  {
    id: '1',
    childId: '1',
    weekOf: '2026-01-13',
    content: `Weekly Plan for Emma Johnson:

**Social Skills Development:**
- Daily circle time with structured turn-taking activities (10 mins)
- Peer buddy system during free play
- Practice greeting routines at start/end of day

**Communication Goals:**
- Use visual schedule with 8-10 activities
- Encourage 3-4 word phrases during snack time
- Picture exchange communication practice

**Sensory Integration:**
- Quiet corner access with weighted blanket
- Tactile play with sensory bins (15 mins daily)
- Movement breaks every 30 minutes

**Academic Readiness:**
- Letter recognition games (colors & shapes)
- Number counting with manipulatives
- Story time with comprehension questions

**Recommendations:** Emma is showing great progress with peer interactions. Continue encouraging verbal communication during structured activities.`,
    generatedDate: '2026-01-12',
  },
  {
    id: '2',
    childId: '2',
    weekOf: '2026-01-13',
    content: `Weekly Plan for Liam Smith:

**Behavioral Support:**
- Visual timer for transitions (5-minute warnings)
- Token economy system for task completion
- Calm-down strategies practice (deep breathing, counting)

**Communication Development:**
- AAC device practice during group activities
- Social stories for common scenarios
- Request training using preferred items

**Motor Skills:**
- Fine motor activities: playdough, beading
- Gross motor: obstacle course, ball play
- Handwriting pre-skills practice

**Academic Activities:**
- Matching and sorting games
- Simple pattern recognition
- Following 2-step directions

**Recommendations:** Liam benefits from clear expectations and visual supports. Consider increasing peer interaction opportunities in structured settings.`,
    generatedDate: '2026-01-12',
  },
];

export const mockTimeline = [
  {
    id: '1',
    type: 'document_upload',
    title: 'Assessment Report Uploaded',
    description: 'Dr. Sarah Miller uploaded Initial Evaluation',
    date: '2025-09-05',
    childId: '1',
  },
  {
    id: '2',
    type: 'ai_plan',
    title: 'AI Weekly Plan Generated',
    description: 'Weekly education plan created for Emma',
    date: '2025-09-10',
    childId: '1',
  },
  {
    id: '3',
    type: 'document_upload',
    title: 'Progress Note Added',
    description: 'Ms. Jennifer Lee uploaded October Progress',
    date: '2025-10-30',
    childId: '1',
  },
  {
    id: '4',
    type: 'ai_plan',
    title: 'Updated Plan Available',
    description: 'New weekly plan based on recent progress',
    date: '2026-01-12',
    childId: '1',
  },
];

export const mockAIRecommendations = [
  {
    id: '1',
    childId: '1',
    type: 'activity',
    title: 'Social Skills Activity',
    description: 'Try "Emotion Charades" - use picture cards showing different emotions and have children act them out. Great for building empathy and recognition.',
    priority: 'high',
  },
  {
    id: '2',
    childId: '2',
    type: 'strategy',
    title: 'Transition Support',
    description: 'Implement a "First-Then" board: Show the current activity and next activity with pictures. This helps reduce anxiety during transitions.',
    priority: 'medium',
  },
  {
    id: '3',
    childId: '1',
    type: 'resource',
    title: 'Communication Tool',
    description: 'Consider introducing a choice board with 4-6 preferred activities. Let Emma practice making choices during free time.',
    priority: 'low',
  },
];
