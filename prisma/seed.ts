/**
 * Demo data for Streamly. Run with `npm run db:seed` (also runs automatically the first
 * time `npm run dev` finds an empty database).
 *
 * Video files are public sample clips (Blender Foundation open movies under CC BY,
 * W3C/MDN/Video.js test media). Thumbnails come from picsum.photos and avatars from pravatar.cc.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, type NotificationType, type Visibility } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Deterministic randomness so every seed produces the same data.
let seed = 20260929;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const sample = <T,>(arr: T[], n: number) => [...arr].sort(() => rand() - 0.5).slice(0, n);
const daysAgo = (d: number, jitterHours = 12) => new Date(Date.now() - d * 86_400_000 - int(0, jitterHours) * 3_600_000);

const SOURCES = {
  bbb: { url: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4", seconds: 597 },
  elephants: { url: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4", seconds: 654 },
  sintel: { url: "https://archive.org/download/Sintel/sintel-2048-surround_512kb.mp4", seconds: 888 },
  movie300: { url: "https://media.w3.org/2010/05/video/movie_300.mp4", seconds: 300 },
  oceans: { url: "https://vjs.zencdn.net/v/oceans.mp4", seconds: 47 },
  sintelTrailer: { url: "https://media.w3.org/2010/05/sintel/trailer.mp4", seconds: 52 },
  bunnyTrailer: { url: "https://media.w3.org/2010/05/bunny/trailer.mp4", seconds: 33 },
  flower: { url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", seconds: 5 },
  friday: { url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4", seconds: 6 },
  jellyfish: { url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4", seconds: 10 },
  bbbClip: { url: "https://www.w3schools.com/html/mov_bbb.mp4", seconds: 10 },
} as const;
type SourceKey = keyof typeof SOURCES;
const LONG: SourceKey[] = ["movie300", "bbb", "elephants", "sintel"];

const CATEGORIES = [
  ["Music", "music"],
  ["Gaming", "gaming"],
  ["Technology", "technology"],
  ["Travel", "travel"],
  ["Cooking", "cooking"],
  ["Education", "education"],
  ["Sports", "sports"],
  ["Film & Animation", "film-animation"],
  ["Science", "science"],
  ["Fitness", "fitness"],
  ["Comedy", "comedy"],
  ["News", "news"],
] as const;

type ChannelSeed = {
  username: string;
  name: string;
  avatar: number;
  bio: string;
  location?: string;
  verified?: boolean;
  links?: { label: string; url: string }[];
  joined: number;
};

const CHANNELS: ChannelSeed[] = [
  { username: "demo", name: "Alex Rivera", avatar: 12, bio: "Filmmaker and weekend traveller. This is the demo account — sign in with demo@streamly.dev / streamly123 to try everything.", location: "Lisbon, Portugal", joined: 400, links: [{ label: "Portfolio", url: "https://example.com/alex" }] },
  { username: "northbound", name: "Northbound Travel", avatar: 33, bio: "Slow travel films from the far north and beyond. New journeys every other Sunday.", location: "Tromsø, Norway", verified: true, joined: 1600, links: [{ label: "Instagram", url: "https://instagram.com/northbound" }, { label: "Newsletter", url: "https://example.com/northbound" }] },
  { username: "bytesized", name: "Byte Sized", avatar: 8, bio: "Tech explained in 10 minutes or less. Reviews, deep dives and honest takes.", location: "Berlin, Germany", verified: true, joined: 2100, links: [{ label: "Website", url: "https://example.com/bytesized" }] },
  { username: "kitchentheory", name: "Kitchen Theory", avatar: 47, bio: "Home cooking with the science behind it. Recipes that actually work on a weeknight.", location: "Lyon, France", verified: true, joined: 1300 },
  { username: "lumenstudios", name: "Lumen Studios", avatar: 60, bio: "Independent animation studio sharing open films, breakdowns and behind-the-scenes.", location: "Amsterdam, Netherlands", verified: true, joined: 2500, links: [{ label: "Studio", url: "https://example.com/lumen" }] },
  { username: "pixelarcade", name: "Pixel Arcade", avatar: 15, bio: "Indie games, speedruns and retro deep cuts.", location: "Montréal, Canada", joined: 900 },
  { username: "quiethours", name: "Quiet Hours", avatar: 44, bio: "Lo-fi, ambient and field recordings to focus, study or wind down.", joined: 1100 },
  { username: "fieldnotes", name: "Field Notes Science", avatar: 53, bio: "Curious about everything. Short documentaries about the natural world.", location: "Cape Town, South Africa", verified: true, joined: 1800 },
  { username: "stride", name: "Stride Fitness", avatar: 5, bio: "No-equipment workouts and running form tips from a certified coach.", location: "Austin, USA", joined: 700 },
  { username: "dailybrief", name: "The Daily Brief", avatar: 68, bio: "The day’s biggest stories in five minutes, without the noise.", location: "London, UK", verified: true, joined: 1500 },
  { username: "laughtrack", name: "Laugh Track", avatar: 22, bio: "Sketches, bloopers and the occasional terrible pun.", joined: 600 },
  { username: "openclassroom", name: "Open Classroom", avatar: 26, bio: "Free lessons in maths, history and writing. Learn something new every week.", location: "Toronto, Canada", joined: 2000 },
  { username: "samokafor", name: "Sam Okafor", avatar: 51, bio: "Football analysis, training days and match-day vlogs.", location: "Lagos, Nigeria", joined: 500 },
];

type VideoSeed = {
  channel: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  source: SourceKey | "long";
  views: [number, number];
  days: number;
  visibility?: Visibility;
};

const OPEN_MOVIE_CREDIT = "\n\nThis film is an open movie by the Blender Foundation, shared under Creative Commons Attribution (CC BY).";

const VIDEOS: VideoSeed[] = [
  // Film & Animation — the actual open movies
  { channel: "lumenstudios", category: "film-animation", title: "Big Buck Bunny — Full Short Film", description: "A giant rabbit takes on three bullying rodents in this classic open animated short." + OPEN_MOVIE_CREDIT, tags: ["animation", "short film", "blender", "open movie"], source: "bbb", views: [800_000, 2_400_000], days: 190 },
  { channel: "lumenstudios", category: "film-animation", title: "Elephants Dream — The First Open Movie", description: "Two characters explore a strange mechanical world in the very first open movie project." + OPEN_MOVIE_CREDIT, tags: ["animation", "surreal", "blender", "open movie"], source: "elephants", views: [300_000, 900_000], days: 260 },
  { channel: "lumenstudios", category: "film-animation", title: "Sintel — Full Animated Short (4K remaster)", description: "A lonely young woman searches for the baby dragon she befriended. A story about loss and growing up." + OPEN_MOVIE_CREDIT, tags: ["animation", "fantasy", "dragon", "blender", "open movie"], source: "sintel", views: [1_200_000, 3_500_000], days: 120 },
  { channel: "lumenstudios", category: "film-animation", title: "Sintel — Official Trailer", description: "The trailer for Sintel." + OPEN_MOVIE_CREDIT, tags: ["trailer", "animation"], source: "sintelTrailer", views: [90_000, 300_000], days: 125 },
  { channel: "lumenstudios", category: "film-animation", title: "How we animated a furry rabbit in 2008", description: "A behind-the-scenes look at the hair and fur pipeline of our first big short.", tags: ["behind the scenes", "animation", "vfx"], source: "long", views: [40_000, 160_000], days: 30 },

  // Travel
  { channel: "northbound", category: "travel", title: "72 Hours Chasing the Northern Lights in Tromsø", description: "Three nights, two failed forecasts and one unforgettable aurora. Everything we packed, where we stayed and how we found clear skies.\n\nChapters in the description below.", tags: ["travel", "norway", "northern lights", "aurora"], source: "long", views: [400_000, 1_100_000], days: 12 },
  { channel: "northbound", category: "travel", title: "Iceland Ring Road in 7 Days: The Honest Guide", description: "Costs, driving times and the stops that are actually worth it.", tags: ["iceland", "road trip", "travel guide"], source: "long", views: [150_000, 600_000], days: 45 },
  { channel: "northbound", category: "travel", title: "Sleeping in a Glass Igloo Above the Arctic Circle", description: "Is it worth the price? We spent a night to find out.", tags: ["arctic", "finland", "hotel review"], source: "long", views: [90_000, 350_000], days: 80 },
  { channel: "northbound", category: "travel", title: "Ocean swell at dawn", description: "Short clip from the Lofoten coast.", tags: ["ocean", "shorts", "norway"], source: "oceans", views: [20_000, 120_000], days: 5 },
  { channel: "demo", category: "travel", title: "Lisbon in One Day: Trams, Tiles and Pastéis", description: "My favourite loop through Alfama, Baixa and Belém — and where to get the best custard tart.", tags: ["lisbon", "portugal", "city guide"], source: "long", views: [8_000, 30_000], days: 20 },

  // Technology
  { channel: "bytesized", category: "technology", title: "I Used Only Open-Source Apps for 30 Days", description: "From office suites to photo editing: what worked, what didn’t and what I kept.", tags: ["open source", "linux", "productivity"], source: "long", views: [500_000, 1_400_000], days: 9 },
  { channel: "bytesized", category: "technology", title: "How Video Streaming Actually Works (Adaptive Bitrate Explained)", description: "Why your video gets blurry for a second and then sharp again. Codecs, segments and CDNs in plain English.", tags: ["streaming", "video", "explained", "tech"], source: "long", views: [200_000, 700_000], days: 33 },
  { channel: "bytesized", category: "technology", title: "The Best Budget Mechanical Keyboards of the Year", description: "Five keyboards under $80, tested for a month each.", tags: ["keyboard", "review", "budget"], source: "long", views: [120_000, 480_000], days: 70 },
  { channel: "bytesized", category: "technology", title: "Build a Home Server From an Old Laptop", description: "Step by step: backups, media streaming and a personal cloud.", tags: ["homelab", "server", "diy"], source: "long", views: [300_000, 900_000], days: 150 },

  // Cooking
  { channel: "kitchentheory", category: "cooking", title: "The Science of the Perfect Crispy Potato", description: "Parboil, rough up, and why a pinch of baking soda changes everything.", tags: ["cooking", "potatoes", "food science", "recipe"], source: "long", views: [600_000, 1_700_000], days: 16 },
  { channel: "kitchentheory", category: "cooking", title: "Fresh Pasta With Just Flour, Eggs and a Fork", description: "No machine, no stress. The ratio, the knead and three sauces in 20 minutes.", tags: ["pasta", "italian", "recipe"], source: "long", views: [250_000, 800_000], days: 58 },
  { channel: "kitchentheory", category: "cooking", title: "One-Pan Weeknight Curry in 25 Minutes", description: "A flexible curry you can make with whatever vegetables you have.", tags: ["curry", "quick dinner", "vegetarian"], source: "long", views: [90_000, 400_000], days: 3 },
  { channel: "kitchentheory", category: "cooking", title: "Flowers on a cake in 5 seconds", description: "Quick decorating trick.", tags: ["baking", "shorts"], source: "flower", views: [40_000, 250_000], days: 2 },

  // Music
  { channel: "quiethours", category: "music", title: "Lo-fi Beats for Deep Focus — 1 Hour Mix", description: "Warm, low-key beats for studying and coding. No ads mid-mix.", tags: ["lofi", "study music", "focus", "chill"], source: "long", views: [1_500_000, 4_000_000], days: 200 },
  { channel: "quiethours", category: "music", title: "Rain on a Tin Roof — Ambient Field Recording", description: "Recorded on a stormy night in the Scottish Highlands.", tags: ["ambient", "rain", "sleep", "field recording"], source: "long", views: [700_000, 1_900_000], days: 95 },
  { channel: "quiethours", category: "music", title: "Friday night synth loop", description: "A 6-second loop that’s been stuck in my head all week.", tags: ["synth", "loop", "shorts"], source: "friday", views: [15_000, 90_000], days: 1 },

  // Gaming
  { channel: "pixelarcade", category: "gaming", title: "10 Indie Games You Probably Missed This Year", description: "Hidden gems from small studios, all under $20.", tags: ["indie games", "top 10", "gaming"], source: "long", views: [300_000, 950_000], days: 22 },
  { channel: "pixelarcade", category: "gaming", title: "Any% Speedrun Explained: Every Trick, Frame by Frame", description: "We break down a world-record run and the glitches that make it possible.", tags: ["speedrun", "retro", "explained"], source: "long", views: [180_000, 600_000], days: 64 },
  { channel: "pixelarcade", category: "gaming", title: "Building a Retro Handheld From Scratch", description: "Raspberry Pi, a 3D-printed shell and far too much solder.", tags: ["retro", "diy", "raspberry pi"], source: "long", views: [90_000, 350_000], days: 140 },

  // Science
  { channel: "fieldnotes", category: "science", title: "The Secret Life of Jellyfish", description: "No brain, no heart, 500 million years of success. How do they do it?", tags: ["jellyfish", "ocean", "biology", "nature"], source: "long", views: [400_000, 1_200_000], days: 27 },
  { channel: "fieldnotes", category: "science", title: "Why the Sky Is Blue (and Sunsets Are Red)", description: "Rayleigh scattering explained with a glass of milky water.", tags: ["physics", "light", "explained"], source: "long", views: [200_000, 800_000], days: 110 },
  { channel: "fieldnotes", category: "science", title: "Jellyfish pulse in slow motion", description: "Ten seconds of calm.", tags: ["jellyfish", "shorts", "slow motion"], source: "jellyfish", views: [60_000, 300_000], days: 6 },

  // Fitness
  { channel: "stride", category: "fitness", title: "20-Minute Full-Body Workout, No Equipment", description: "Warm-up, three rounds and a cool-down. Suitable for beginners.", tags: ["workout", "home workout", "no equipment"], source: "long", views: [350_000, 1_000_000], days: 14 },
  { channel: "stride", category: "fitness", title: "Fix Your Running Form in 5 Minutes", description: "Cadence, posture and foot strike — the three things that matter most.", tags: ["running", "form", "tips"], source: "long", views: [120_000, 450_000], days: 50 },

  // News
  { channel: "dailybrief", category: "news", title: "This Week in Tech and Science, Explained", description: "The five stories that mattered this week, in context.", tags: ["news", "weekly", "tech", "science"], source: "long", views: [100_000, 300_000], days: 1 },
  { channel: "dailybrief", category: "news", title: "How Elections Are Counted: A Visual Guide", description: "From polling station to final result.", tags: ["explainer", "elections", "civics"], source: "long", views: [80_000, 250_000], days: 40 },

  // Comedy
  { channel: "laughtrack", category: "comedy", title: "When the Group Project Has One Person Doing Everything", description: "We’ve all been there.", tags: ["sketch", "comedy", "school"], source: "long", views: [400_000, 1_300_000], days: 18 },
  { channel: "laughtrack", category: "comedy", title: "Bunny vs. the Bullies (Blooper Edition)", description: "Things did not go as planned.", tags: ["bloopers", "shorts"], source: "bbbClip", views: [80_000, 400_000], days: 4 },

  // Education
  { channel: "openclassroom", category: "education", title: "Calculus in 15 Minutes: The Big Idea", description: "Derivatives and integrals without the scary notation.", tags: ["maths", "calculus", "learn"], source: "long", views: [600_000, 1_800_000], days: 300 },
  { channel: "openclassroom", category: "education", title: "How to Write a Great Essay Introduction", description: "Hook, context, thesis — with three real examples.", tags: ["writing", "essay", "study tips"], source: "long", views: [150_000, 500_000], days: 75 },

  // Sports
  { channel: "samokafor", category: "sports", title: "Match-Day Vlog: Cup Final From the Stands", description: "Train ride, chants, the late winner and the long night after.", tags: ["football", "vlog", "match day"], source: "long", views: [60_000, 250_000], days: 8 },
  { channel: "samokafor", category: "sports", title: "Tactical Breakdown: How the Press Won the Final", description: "Five clips that decided the game.", tags: ["football", "tactics", "analysis"], source: "long", views: [40_000, 180_000], days: 25 },

  // Demo creator's own uploads (studio has data to show)
  { channel: "demo", category: "film-animation", title: "My First Short Film: Behind the Camera", description: "What I learned making a 5-minute short with a phone and a borrowed tripod.", tags: ["filmmaking", "short film", "beginner"], source: "long", views: [12_000, 40_000], days: 60 },
  { channel: "demo", category: "education", title: "Color Grading Basics for Beginners", description: "Exposure, white balance and a simple look in any editor.", tags: ["color grading", "editing", "tutorial"], source: "long", views: [20_000, 60_000], days: 35 },
  { channel: "demo", category: "travel", title: "Trailer: Coastline (work in progress)", description: "An early cut of my next project. Unlisted — only people with the link can see it.", tags: ["trailer", "wip"], source: "bunnyTrailer", views: [300, 1_500], days: 6, visibility: "UNLISTED" },
  { channel: "demo", category: "film-animation", title: "Rough cut v3 (private)", description: "Private draft. Only I can see this.", tags: ["draft"], source: "long", views: [3, 20], days: 2, visibility: "PRIVATE" },
];

const COMMENTS = [
  "This is exactly what I needed today. Thank you!",
  "The editing on this is incredible. How long did it take?",
  "Watched this twice already. The part around the middle is so good.",
  "Could you do a follow-up on this? I have so many questions.",
  "Saved to my playlist. Great explanation.",
  "I tried this at home and it actually worked 🙌",
  "Underrated channel. Deserves way more subscribers.",
  "The sound design here is so relaxing.",
  "Honestly the best video on this topic I've found.",
  "Came for the thumbnail, stayed for the whole thing.",
  "Is there a written version of this somewhere?",
  "The pacing is perfect — no filler at all.",
  "My kids loved this one!",
  "Please make a longer version 🙏",
  "Can you share what camera you used?",
  "This deserves to go viral.",
  "I've been following since the early days and the quality just keeps getting better.",
  "Great video, but the music was a bit loud in places.",
];
const REPLIES = [
  "Totally agree!",
  "Same here, haha.",
  "Thanks for asking — I was wondering the same thing.",
  "Check the description, it's linked there.",
  "Glad it helped!",
  "This comment deserves more likes.",
];

async function main() {
  console.log("Seeding Streamly demo data…");

  // Clean slate (order respects foreign keys; cascades handle the rest).
  await db.notification.deleteMany();
  await db.videoView.deleteMany();
  await db.user.deleteMany();
  await db.tag.deleteMany();
  await db.category.deleteMany();

  const categories = await Promise.all(CATEGORIES.map(([name, slug]) => db.category.create({ data: { name, slug } })));
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const passwordHash = await bcrypt.hash("streamly123", 12);
  const users = [];
  for (const c of CHANNELS) {
    users.push(
      await db.user.create({
        data: {
          email: c.username === "demo" ? "demo@streamly.dev" : `${c.username}@streamly.dev`,
          username: c.username,
          name: c.name,
          passwordHash,
          createdAt: daysAgo(c.joined),
          profile: {
            create: {
              avatarUrl: `https://i.pravatar.cc/300?img=${c.avatar}`,
              bannerUrl: `https://picsum.photos/seed/banner-${c.username}/1600/400`,
              bio: c.bio,
              location: c.location ?? null,
              links: c.links ?? [],
              verified: c.verified ?? false,
            },
          },
        },
      })
    );
  }
  const userByName = new Map(users.map((u) => [u.username, u]));
  const demo = userByName.get("demo")!;
  console.log(`  ${users.length} users`);

  const videos = [];
  for (const [i, v] of VIDEOS.entries()) {
    const key: SourceKey = v.source === "long" ? LONG[i % LONG.length] : v.source;
    const source = SOURCES[key];
    const createdAt = daysAgo(v.days);
    const video = await db.video.create({
      data: {
        title: v.title,
        description: v.description,
        videoUrl: source.url,
        thumbnailUrl: `https://picsum.photos/seed/streamly-${i + 11}/1280/720`,
        durationSeconds: source.seconds,
        isShort: source.seconds <= 60,
        visibility: v.visibility ?? "PUBLIC",
        views: int(v.views[0], v.views[1]),
        ownerId: userByName.get(v.channel)!.id,
        categoryId: categoryBySlug.get(v.category)!,
        createdAt,
        updatedAt: createdAt,
        tags: {
          create: await Promise.all(
            v.tags.map(async (name) => {
              const tag = await db.tag.upsert({ where: { name }, create: { name }, update: {} });
              return { tagId: tag.id };
            })
          ),
        },
      },
    });
    videos.push(video);
  }
  const publicVideos = videos.filter((v) => v.visibility === "PUBLIC");
  console.log(`  ${videos.length} videos`);

  // Subscriptions: everyone follows a handful of channels; the demo account follows six.
  const subs: { subscriberId: string; channelId: string; createdAt: Date }[] = [];
  for (const u of users) {
    const n = u.id === demo.id ? 6 : int(3, 8);
    const targets = sample(users.filter((x) => x.id !== u.id && (u.id !== demo.id || x.username !== "laughtrack")), n);
    for (const t of targets) subs.push({ subscriberId: u.id, channelId: t.id, createdAt: daysAgo(int(1, 200)) });
  }
  // Make sure the demo channel has recent subscribers for its studio stats.
  for (const u of users.filter((x) => x.id !== demo.id)) {
    if (!subs.some((s) => s.subscriberId === u.id && s.channelId === demo.id) && rand() < 0.7) {
      subs.push({ subscriberId: u.id, channelId: demo.id, createdAt: daysAgo(int(1, 25)) });
    }
  }
  await db.subscription.createMany({ data: subs, skipDuplicates: true });
  console.log(`  ${subs.length} subscriptions`);

  // Likes / dislikes
  const likes: { userId: string; videoId: string; type: "LIKE" | "DISLIKE"; createdAt: Date }[] = [];
  for (const u of users) {
    for (const v of sample(publicVideos.filter((x) => x.ownerId !== u.id), int(6, 16))) {
      likes.push({ userId: u.id, videoId: v.id, type: rand() < 0.92 ? "LIKE" : "DISLIKE", createdAt: daysAgo(int(0, Math.max(1, 30))) });
    }
  }
  await db.like.createMany({ data: likes, skipDuplicates: true });
  console.log(`  ${likes.length} reactions`);

  // Comments, replies and comment likes
  let commentCount = 0;
  for (const v of publicVideos) {
    const authors = sample(users.filter((u) => u.id !== v.ownerId), int(2, 7));
    for (const author of authors) {
      const createdAt = new Date(v.createdAt.getTime() + int(1, 72) * 3_600_000);
      const comment = await db.comment.create({
        data: { videoId: v.id, authorId: author.id, content: pick(COMMENTS), createdAt, updatedAt: createdAt },
      });
      commentCount++;
      const likers = sample(users, int(0, 6));
      if (likers.length) {
        await db.commentLike.createMany({ data: likers.map((l) => ({ userId: l.id, commentId: comment.id })), skipDuplicates: true });
      }
      if (rand() < 0.45) {
        const replier = pick(users.filter((u) => u.id !== author.id));
        const replyAt = new Date(createdAt.getTime() + int(1, 48) * 3_600_000);
        await db.comment.create({
          data: { videoId: v.id, authorId: replier.id, parentId: comment.id, content: pick(REPLIES), createdAt: replyAt, updatedAt: replyAt },
        });
        commentCount++;
      }
    }
  }
  console.log(`  ${commentCount} comments`);

  // Playlists
  const playlistDefs: { owner: string; name: string; description: string; visibility: Visibility; count: number; filter?: (cat: string) => boolean }[] = [
    { owner: "demo", name: "Weekend watch list", description: "Long videos for a slow Sunday.", visibility: "PUBLIC", count: 6 },
    { owner: "demo", name: "Filmmaking inspiration", description: "Shots, grading and storytelling I want to learn from.", visibility: "PUBLIC", count: 5, filter: (c) => c === "film-animation" },
    { owner: "demo", name: "Recipes to try", description: "", visibility: "PRIVATE", count: 3, filter: (c) => c === "cooking" },
    { owner: "lumenstudios", name: "Open Movies Collection", description: "Every open movie we’ve shared, in order.", visibility: "PUBLIC", count: 4, filter: (c) => c === "film-animation" },
    { owner: "quiethours", name: "Focus & Study", description: "Put this on and get things done.", visibility: "PUBLIC", count: 4 },
    { owner: "northbound", name: "Arctic Journeys", description: "All our trips above the Arctic Circle.", visibility: "PUBLIC", count: 4, filter: (c) => c === "travel" },
  ];
  const catById = new Map(categories.map((c) => [c.id, c.slug]));
  for (const p of playlistDefs) {
    const pool = publicVideos.filter((v) => !p.filter || p.filter(catById.get(v.categoryId ?? "") ?? ""));
    const items = sample(pool.length >= p.count ? pool : publicVideos, p.count);
    await db.playlist.create({
      data: {
        name: p.name,
        description: p.description,
        visibility: p.visibility,
        ownerId: userByName.get(p.owner)!.id,
        items: { create: items.map((v, position) => ({ videoId: v.id, position })) },
      },
    });
  }
  console.log(`  ${playlistDefs.length} playlists`);

  // Demo account's history and Watch later
  const watched = sample(publicVideos.filter((v) => v.ownerId !== demo.id), 16);
  await db.watchHistory.createMany({
    data: watched.map((v, i) => ({
      userId: demo.id,
      videoId: v.id,
      watchedAt: daysAgo(i * 0.6, 6),
      progressSeconds: rand() < 0.5 ? int(0, Math.max(0, v.durationSeconds - 20)) : 0,
    })),
  });
  await db.savedVideo.createMany({
    data: sample(publicVideos.filter((v) => v.ownerId !== demo.id && !watched.includes(v)), 5).map((v, i) => ({
      userId: demo.id,
      videoId: v.id,
      createdAt: daysAgo(i, 12),
    })),
  });

  // View events for the last 28 days (studio charts). Richer for the demo channel.
  const views: { videoId: string; userId: string | null; watchSeconds: number; createdAt: Date }[] = [];
  for (const v of videos.filter((x) => x.visibility !== "PRIVATE")) {
    const isDemo = v.ownerId === demo.id;
    const ageDays = Math.min(28, Math.floor((Date.now() - v.createdAt.getTime()) / 86_400_000));
    for (let d = ageDays; d >= 0; d--) {
      const growth = isDemo ? 1 + (28 - d) / 14 : 1;
      const perDay = Math.round((isDemo ? int(12, 30) : int(2, 8)) * growth);
      for (let k = 0; k < perDay; k++) {
        views.push({
          videoId: v.id,
          userId: rand() < 0.3 ? pick(users).id : null,
          watchSeconds: Math.round(v.durationSeconds * (0.25 + rand() * 0.6)),
          createdAt: daysAgo(d, 20),
        });
      }
    }
  }
  for (let i = 0; i < views.length; i += 2000) {
    await db.videoView.createMany({ data: views.slice(i, i + 2000) });
  }
  console.log(`  ${views.length} view events`);

  // Notifications for the demo account
  const demoVideos = videos.filter((v) => v.ownerId === demo.id && v.visibility === "PUBLIC");
  const notifications: { type: NotificationType; recipientId: string; actorId: string; videoId?: string; commentId?: string; read: boolean; createdAt: Date }[] = [];
  const recentSubs = subs.filter((s) => s.channelId === demo.id).slice(0, 4);
  for (const [i, s] of recentSubs.entries()) {
    notifications.push({ type: "NEW_SUBSCRIBER", recipientId: demo.id, actorId: s.subscriberId, read: i > 1, createdAt: daysAgo(i * 1.5, 8) });
  }
  const demoComments = await db.comment.findMany({ where: { videoId: { in: demoVideos.map((v) => v.id) }, parentId: null }, take: 4 });
  for (const [i, c] of demoComments.entries()) {
    notifications.push({ type: "VIDEO_COMMENT", recipientId: demo.id, actorId: c.authorId, videoId: c.videoId, commentId: c.id, read: i > 0, createdAt: daysAgo(i + 0.2, 4) });
  }
  for (const [i, l] of likes.filter((l) => demoVideos.some((v) => v.id === l.videoId) && l.type === "LIKE").slice(0, 3).entries()) {
    notifications.push({ type: "VIDEO_LIKE", recipientId: demo.id, actorId: l.userId, videoId: l.videoId, read: i > 0, createdAt: daysAgo(i * 0.8, 6) });
  }
  // A reply to one of demo's comments elsewhere
  const otherVideo = publicVideos.find((v) => v.ownerId !== demo.id)!;
  const demoComment = await db.comment.create({ data: { videoId: otherVideo.id, authorId: demo.id, content: "This inspired my next trip. Thank you for the detailed guide!" } });
  const replier = userByName.get("northbound")!;
  const reply = await db.comment.create({
    data: { videoId: otherVideo.id, authorId: replier.id, parentId: demoComment.id, content: "Thanks Alex! Send us a postcard 📮" },
  });
  notifications.push({ type: "COMMENT_REPLY", recipientId: demo.id, actorId: replier.id, videoId: otherVideo.id, commentId: reply.id, read: false, createdAt: daysAgo(0.1, 1) });
  await db.notification.createMany({ data: notifications });
  console.log(`  ${notifications.length} notifications`);

  console.log("\nDone. Sign in with demo@streamly.dev / streamly123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
