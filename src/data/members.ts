export interface Member {
  fullName: string;
  nickname: string;
  studentId: string;
  role: string;
  /** Path under /public, e.g. "/members/somchai.jpg". null shows initials instead. */
  photo: string | null;
}

// Placeholders: replace with the real group members.
export const MEMBERS: Member[] = [
  { fullName: 'Member One', nickname: 'One', studentId: '6500000001', role: 'Team lead · state architecture', photo: null },
  { fullName: 'Member Two', nickname: 'Two', studentId: '6500000002', role: 'API layer · TanStack Query', photo: null },
  { fullName: 'Member Three', nickname: 'Three', studentId: '6500000003', role: 'UI/UX · DaisyUI', photo: null },
  { fullName: 'Member Four', nickname: 'Four', studentId: '6500000004', role: 'Routing · testing · docs', photo: null },
];
