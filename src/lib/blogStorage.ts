export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  coverImage: string;
  author: string;
  date: string;
  readTime: number;
  likes: number;
  likedByUser: boolean;
  youtubeUrl?: string;
}

const STORAGE_KEY = "zh_blog_posts";
const BLOG_PASSWORD = "Tddua@2026";

export function verifyPassword(password: string): boolean {
  return password === BLOG_PASSWORD;
}

const defaultPosts: BlogPost[] = [
  {
    id: "1",
    title: "Understanding Anxiety: Signs You Shouldn't Ignore",
    excerpt: "Anxiety is more than just worry. Learn to recognize the physical and emotional signs that indicate it's time to seek support.",
    content: `Anxiety is one of the most common mental health conditions worldwide, yet it often goes unrecognized. Many people dismiss their symptoms as "just stress" or "overthinking," but anxiety can manifest in ways that significantly impact daily life.\n\n## Physical Signs\n\nAnxiety isn't just in your head — it shows up in your body too. Common physical symptoms include:\n\n- **Rapid heartbeat** or palpitations\n- **Muscle tension**, especially in the jaw, neck, and shoulders\n- **Digestive issues** like nausea or stomach pain\n- **Sleep disturbances** — difficulty falling or staying asleep\n- **Fatigue** despite adequate rest\n\n## Emotional & Behavioral Signs\n\n- Persistent worry that feels disproportionate to the situation\n- Difficulty concentrating or mind going blank\n- Irritability or restlessness\n- Avoidance of social situations or responsibilities\n- Feeling on edge or a sense of impending doom\n\n## When to Seek Help\n\nIf anxiety is interfering with your work, relationships, or daily activities, it's time to talk to a professional. Evidence-based treatments like **Cognitive Behavioral Therapy (CBT)** have shown remarkable success in managing anxiety.\n\nRemember: seeking help is a sign of strength, not weakness.`,
    tag: "Mental Health",
    coverImage: "",
    author: "Zil-e-Huma",
    date: "Feb 15, 2026",
    readTime: 5,
    likes: 24,
    likedByUser: false,
  },
  {
    id: "2",
    title: "How CBT Can Transform Your Thought Patterns",
    excerpt: "Cognitive Behavioral Therapy helps you identify and reshape negative thinking. Here's how it works in practice.",
    content: `Cognitive Behavioral Therapy (CBT) is one of the most researched and effective forms of psychotherapy. It's based on the idea that our thoughts, feelings, and behaviors are interconnected — and that changing one can positively influence the others.\n\n## The CBT Model\n\nAt its core, CBT helps you identify **cognitive distortions** — patterns of thinking that aren't based in reality. Common distortions include:\n\n- **All-or-nothing thinking**: Seeing things in black and white\n- **Catastrophizing**: Expecting the worst possible outcome\n- **Mind reading**: Assuming you know what others think\n- **Overgeneralization**: Drawing broad conclusions from single events\n\n## How It Works in Practice\n\nA typical CBT session involves:\n\n1. **Identifying the triggering situation**\n2. **Recognizing automatic thoughts** that arise\n3. **Examining the evidence** for and against those thoughts\n4. **Developing balanced alternatives**\n5. **Testing new beliefs** through behavioral experiments\n\n## Real Results\n\nResearch shows CBT is effective for:\n- Depression and anxiety disorders\n- PTSD and trauma\n- Insomnia\n- Relationship difficulties\n- Anger management\n\nThe beauty of CBT is that it gives you practical tools you can use long after therapy ends.`,
    tag: "Therapy",
    coverImage: "",
    author: "Zil-e-Huma",
    date: "Jan 28, 2026",
    readTime: 6,
    likes: 18,
    likedByUser: false,
  },
  {
    id: "3",
    title: "The Power of Hypnotherapy for Stress Relief",
    excerpt: "Hypnotherapy isn't magic — it's science. Discover how guided relaxation can unlock deep healing and resilience.",
    content: `Hypnotherapy often conjures images of stage shows and swinging pocket watches. But clinical hypnotherapy is a legitimate, evidence-based therapeutic technique used by psychologists worldwide.\n\n## What Is Clinical Hypnotherapy?\n\nClinical hypnotherapy uses guided relaxation and focused attention to achieve a heightened state of awareness — sometimes called a trance. In this state, you're more open to therapeutic suggestions that can help change patterns of behavior, thought, and emotion.\n\n## How It Helps With Stress\n\nDuring hypnotherapy for stress relief:\n\n- Your **nervous system shifts** from fight-or-flight to rest-and-digest\n- **Muscle tension releases** as the body enters deep relaxation\n- **Subconscious patterns** that drive stress responses can be addressed\n- **Coping mechanisms** are strengthened at a deeper level\n\n## What to Expect\n\nA hypnotherapy session typically involves:\n\n1. Discussion of your goals and concerns\n2. A guided relaxation induction\n3. Therapeutic suggestions tailored to your needs\n4. Gentle return to full awareness\n5. Post-session discussion\n\nYou remain in control throughout the entire process. You cannot be made to do anything against your will.\n\n## Who Can Benefit?\n\nHypnotherapy is particularly effective for:\n- Chronic stress and burnout\n- Anxiety and phobias\n- Sleep disorders\n- Pain management\n- Building confidence and resilience`,
    tag: "Hypnotherapy",
    coverImage: "",
    author: "Zil-e-Huma",
    date: "Jan 10, 2026",
    readTime: 7,
    likes: 31,
    likedByUser: false,
  },
];

export function getPosts(): BlogPost[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultPosts;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts));
  return defaultPosts;
}

export function getPost(id: string): BlogPost | undefined {
  return getPosts().find((p) => p.id === id);
}

export function savePost(post: Omit<BlogPost, "id" | "date" | "readTime" | "likes" | "likedByUser">): BlogPost {
  const posts = getPosts();
  const newPost: BlogPost = {
    ...post,
    id: Date.now().toString(),
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    readTime: Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)),
    likes: 0,
    likedByUser: false,
  };
  posts.unshift(newPost);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return newPost;
}

export function toggleLike(id: string): BlogPost | undefined {
  const posts = getPosts();
  const post = posts.find((p) => p.id === id);
  if (post) {
    post.likedByUser = !post.likedByUser;
    post.likes += post.likedByUser ? 1 : -1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
  return post;
}

export function deletePost(id: string): void {
  const posts = getPosts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}
