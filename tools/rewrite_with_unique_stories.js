/**
 * Rewrite duplicate stories with unique, hand-written content
 * All stories written by Claude with perfect spelling and grammar
 */

const admin = require('firebase-admin');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'genius-kids-story-books.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Text-to-Speech client with explicit credentials
const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: serviceAccountPath
});

// All unique stories written by Claude
const UNIQUE_STORIES = {
  // AGE 0-2 STORIES
  'baby-bird-flies': {
    pages: [
      "Baby bird sits in nest. Warm and cozy.",
      "Mama bird brings food. Yum yum!",
      "Baby bird grows bigger. Flap flap wings!",
      "Baby bird stands tall. Looking down.",
      "Baby bird jumps up. Hop hop hop!",
      "Wings go flap flap. Up in air!",
      "Baby bird is flying! Wheee!",
      "Mama bird is proud. Good job, baby bird!"
    ]
  },

  'busy-bee': {
    pages: [
      "Buzzy bee wakes up. Time to work!",
      "Buzzy flies to red flower. Sniff sniff.",
      "Yellow pollen sticks. Tickle tickle!",
      "Buzzy flies to blue flower. So pretty!",
      "More flowers, more pollen. Buzz buzz buzz!",
      "Buzzy goes back home. Tired bee.",
      "Buzzy makes sweet honey. Yummy!",
      "Buzzy sleeps in hive. Good night, bee!"
    ]
  },

  'dancing-leaves': {
    pages: [
      "Wind blows softly. Whoosh whoosh.",
      "Green leaves wiggle. Dance dance!",
      "Red leaf twirls around. Spin spin spin!",
      "Yellow leaf jumps high. Up up up!",
      "Orange leaf floats down. Down down down!",
      "Brown leaves dance together. Swirl swirl!",
      "All leaves on ground. Crunch crunch!",
      "Time to rest now. Shhhh, quiet leaves."
    ]
  },

  'happy-puppy': {
    pages: [
      "Puppy wakes up early. Stretch and yawn!",
      "Puppy eats breakfast. Chomp chomp chomp!",
      "Puppy finds red ball. Mine mine mine!",
      "Ball rolls away. Chase it, puppy!",
      "Puppy catches ball. Good catch!",
      "Puppy meets friend. Wag wag tail!",
      "Friends play together. Run run run!",
      "Tired puppy sleeps. Sweet dreams, puppy!"
    ]
  },

  'hop-hop-bunny': {
    pages: [
      "Little bunny in meadow. Twitch twitch nose!",
      "Bunny hops forward. Hop!",
      "Bunny hops again. Hop hop!",
      "Bunny finds green grass. Munch munch!",
      "Bunny sees orange carrot. Yummy treat!",
      "Bunny digs hole. Dig dig dig!",
      "Bunny hops in hole. Safe and cozy!",
      "Bunny takes nap. Night night, bunny!"
    ]
  },

  'little-cloud-s-big-day': {
    pages: [
      "Little cloud floats high. White and fluffy!",
      "Wind pushes cloud. Whoosh, moving fast!",
      "Cloud sees birds below. Hello, birds!",
      "Cloud turns gray. Getting full!",
      "Raindrops fall down. Drip drop drip!",
      "Plants drink water. Thank you, cloud!",
      "Cloud feels lighter. All empty now!",
      "Sun comes out. Rainbow appears! Pretty!"
    ]
  },

  'rainy-day-fun': {
    pages: [
      "Rain falls outside. Tap tap tap!",
      "Puddles on ground. Splish splash!",
      "Red boots go on. Jump time!",
      "Jumping in puddles. Splash splash splash!",
      "Water goes everywhere. Wheee!",
      "Worms come out. Hello, worms!",
      "Rainbow in sky. So many colors!",
      "Rain stops falling. What a fun day!"
    ]
  },

  'shiny-stars': {
    pages: [
      "Night time arrives. Sky gets dark.",
      "One star appears. Twinkle twinkle!",
      "More stars come out. Two, three, four!",
      "So many stars now. Counting them!",
      "Big moon is smiling. Hello, moon!",
      "Stars make pictures. Connect the dots!",
      "Owl hoots below. Hoo hoo!",
      "Stars shine all night. Goodnight, stars!"
    ]
  },

  'sleepy-kitten': {
    pages: [
      "Kitten plays all day. Chase the string!",
      "Batting at toys. Bop bop bop!",
      "Kitten gets sleepy. Big yawn!",
      "Kitten finds soft bed. So cozy!",
      "Kitten curls in ball. Round and round!",
      "Tail covers nose. Warm and snug!",
      "Eyes slowly close. Heavy heavy!",
      "Kitten is sleeping. Purr purr purr!"
    ]
  },

  'snowy-day': {
    pages: [
      "White snow falling. Flutter flutter down!",
      "Everything turns white. So pretty!",
      "Bundle up warm. Hat and mittens!",
      "Go outside to play. Crunch crunch!",
      "Make snowballs. Pack pack pack!",
      "Build snow friend. Big and round!",
      "Slide down hill. Wheee, so fast!",
      "Time to go inside. Hot cocoa!"
    ]
  },

  // AGE 3-5 STORIES (20 unique stories)
  'brave-little-firefly': {
    pages: [
      "Little firefly named Flicker was afraid of the dark forest.",
      "Other fireflies glowed brightly, but Flicker's light was dim.",
      "One night, a baby rabbit got lost in the woods.",
      "Flicker heard the rabbit crying and wanted to help.",
      "Even though scared, Flicker flew toward the sound.",
      "Flicker's small light guided the way through dark trees.",
      "The baby rabbit saw Flicker's glow and followed it.",
      "Flicker led the rabbit safely back to its family.",
      "The other fireflies cheered for brave Flicker.",
      "Flicker learned that even small lights can make a big difference."
    ]
  },

  'calm-cat': {
    pages: [
      "Whiskers the cat lived in a busy house with noisy children.",
      "Sometimes the noise made Whiskers feel overwhelmed and jumpy.",
      "One day, Grandma showed Whiskers a quiet sunny spot by the window.",
      "Whiskers sat very still and took slow, deep breaths.",
      "Whiskers watched the clouds drift peacefully across the sky.",
      "The noise seemed quieter when Whiskers focused on breathing.",
      "Every day, Whiskers practiced sitting calmly in the sunny spot.",
      "Soon, Whiskers could stay calm even when things got loud.",
      "The children noticed and started sitting quietly with Whiskers.",
      "Everyone learned that staying calm helps you feel better."
    ]
  },

  'creative-caterpillar': {
    pages: [
      "Camilla the caterpillar loved making beautiful things from leaves.",
      "She folded leaves into boats and stacked them into towers.",
      "Other bugs said, 'Caterpillars only eat leaves, not play with them!'",
      "But Camilla kept creating because it made her happy.",
      "She wove leaves together to make colorful patterns.",
      "One day, she made a magnificent leaf castle.",
      "All the garden bugs came to see Camilla's amazing creation.",
      "They realized that being different and creative is wonderful.",
      "Soon, other bugs started making their own art too.",
      "Camilla learned that creativity can inspire everyone around you."
    ]
  },

  'curious-kit-the-fox': {
    pages: [
      "Kit the fox cub always asked questions about everything.",
      "'Why is the sky blue? How do trees grow?'",
      "Mother Fox patiently answered each question Kit asked.",
      "One day, Kit wondered where the stream went.",
      "Kit followed the water through the forest, asking animals along the way.",
      "A wise turtle explained how streams flow to the ocean.",
      "Kit learned about fish, rocks, and water plants.",
      "By asking questions, Kit discovered so many new things.",
      "Mother Fox was proud of Kit's curious mind.",
      "Kit learned that asking questions helps you learn about the world."
    ]
  },

  'flexible-flamingo': {
    pages: [
      "Felicity the flamingo only liked to do things one way.",
      "She always stood on her left leg, never the right one.",
      "She ate at the same spot and walked the same path every day.",
      "One morning, Felicity's favorite spot was flooded.",
      "She had to try a new place, which made her nervous.",
      "The new spot had different fish and new flamingo friends.",
      "Felicity tried standing on her right leg and it felt fine!",
      "She discovered that trying new things can be fun.",
      "Soon, Felicity enjoyed exploring different parts of the lake.",
      "Felicity learned that being flexible opens up new adventures."
    ]
  },

  'lily-s-garden-of-feelings': {
    pages: [
      "Lily had many feelings but didn't know how to express them.",
      "When angry, she stomped. When sad, she hid.",
      "Grandpa gave Lily seeds to plant in her own garden.",
      "'Each seed represents a feeling,' Grandpa explained.",
      "Red flowers for anger, blue for sadness, yellow for happiness.",
      "Lily watered the seeds and talked about her feelings.",
      "As the flowers grew, Lily learned to name her emotions.",
      "She could say, 'I feel angry' or 'I feel joyful.'",
      "Talking about feelings helped Lily feel better inside.",
      "Lily learned that all feelings are okay and important."
    ]
  },

  'max-and-the-magic-words': {
    pages: [
      "Max the mouse never said please or thank you.",
      "He grabbed cheese without asking and never showed gratitude.",
      "One day, Max met a fairy who taught him magic words.",
      "'Please and thank you are the most powerful words,' she said.",
      "Max tried saying 'Please may I have some cheese?'",
      "The other mice smiled and happily shared their cheese.",
      "When Max said 'Thank you,' everyone felt appreciated.",
      "Max noticed that using kind words made friends happy.",
      "Soon, Max used magic words all the time.",
      "Max learned that good manners make the world a kinder place."
    ]
  },

  'penny-the-patient-penguin': {
    pages: [
      "Penny the penguin wanted to catch fish like the big penguins.",
      "She jumped in the water but the fish swam away too fast.",
      "Penny felt frustrated and wanted to give up.",
      "Her father said, 'Learning takes time and patience.'",
      "Penny practiced every day, waiting quietly by the ice hole.",
      "Some days she caught nothing, but she kept trying.",
      "After many tries, Penny finally caught her first fish!",
      "She was so proud of herself for not giving up.",
      "The other penguins celebrated Penny's achievement.",
      "Penny learned that patience and practice lead to success."
    ]
  },

  'responsible-robin': {
    pages: [
      "Ruby the robin was supposed to help build the nest.",
      "But Ruby wanted to play instead of gathering twigs.",
      "'I'll do it later,' Ruby said, flying off to have fun.",
      "When a storm came, the nest wasn't finished.",
      "Ruby and her family had nowhere safe to stay.",
      "Ruby felt terrible for not helping when she should have.",
      "After the storm, Ruby worked hard gathering the best twigs.",
      "She didn't stop until the nest was strong and cozy.",
      "Her family was safe because Ruby took responsibility.",
      "Ruby learned that being responsible means doing what you promise."
    ]
  },

  'strong-sophie-squirrel': {
    pages: [
      "Sophie the squirrel tried to crack a big acorn but couldn't.",
      "'I'm not strong enough!' Sophie cried.",
      "Her brother said, 'Keep trying, you'll get stronger.'",
      "Every day, Sophie practiced cracking smaller nuts first.",
      "Her jaw got stronger and stronger with each try.",
      "Sophie also asked others to show her their techniques.",
      "She learned to twist and crack the shells just right.",
      "After many days, Sophie cracked the big acorn!",
      "All her hard work and practice had paid off.",
      "Sophie learned that perseverance makes you stronger."
    ]
  },

  'team-turtle': {
    pages: [
      "Five turtles found a huge log blocking their path to the pond.",
      "Tommy turtle tried to push it alone, but it wouldn't budge.",
      "'I can't do it by myself,' Tommy admitted.",
      "The other turtles came over to help push together.",
      "'Let's all push on the count of three!' they said.",
      "Together, they pushed and pushed with all their might.",
      "Slowly, the heavy log started to roll away.",
      "Working as a team, they cleared the path to the water.",
      "The turtles splashed happily in the pond together.",
      "Tommy learned that teamwork makes difficult tasks possible."
    ]
  },

  'the-forgiving-frog': {
    pages: [
      "Freddie the frog and his friend Lily had a big argument.",
      "Lily accidentally knocked over Freddie's favorite lily pad.",
      "Freddie was so angry, he said mean things to Lily.",
      "Lily felt sad and apologized, but Freddie swam away mad.",
      "Freddie sat alone feeling angry, but also lonely.",
      "He remembered all the fun times he had with Lily.",
      "Freddie realized that everyone makes mistakes sometimes.",
      "He swam back and said, 'I forgive you, I'm sorry too.'",
      "Lily and Freddie became friends again, even closer than before.",
      "Freddie learned that forgiving others heals hurt feelings."
    ]
  },

  'the-friendship-bridge': {
    pages: [
      "Bear lived on one side of the river, Deer on the other.",
      "They waved at each other but could never play together.",
      "The river was too wide and the current too strong.",
      "'We need a bridge,' said Bear.",
      "Bear gathered logs while Deer collected strong vines.",
      "They worked from opposite sides, building toward the middle.",
      "It took many days, but they didn't give up.",
      "Finally, the bridge connected both sides of the river!",
      "Bear and Deer met in the middle with a big hug.",
      "They learned that friendship is worth working hard for."
    ]
  },

  'the-helper-hedgehog': {
    pages: [
      "Henry the hedgehog saw Mrs. Rabbit struggling with groceries.",
      "Her bags were heavy and starting to rip.",
      "Henry offered to help carry them to her burrow.",
      "Mrs. Rabbit was so grateful for Henry's kindness.",
      "The next day, Henry helped Mr. Bird fix his nest.",
      "Soon, Henry was helping someone different every day.",
      "The other animals noticed Henry's generous spirit.",
      "When Henry needed help moving a heavy rock, everyone came.",
      "Together, they moved it easily because Henry had helped them all.",
      "Henry learned that helping others creates a caring community."
    ]
  },

  'the-honest-hippo': {
    pages: [
      "Harold the hippo found a shiny necklace by the river.",
      "It was so beautiful, and he wanted to keep it.",
      "But Harold knew it must belong to someone.",
      "'Finders keepers!' his friend said.",
      "Harold thought about it but knew that wouldn't be right.",
      "He asked all the animals if they had lost a necklace.",
      "Giraffe said, 'Oh, that's my grandmother's necklace! Thank you!'",
      "Giraffe was so happy and gave Harold a big thank you.",
      "Harold felt wonderful inside for being honest.",
      "Harold learned that honesty makes you feel proud of yourself."
    ]
  },

  'the-listening-owl': {
    pages: [
      "Olivia the owl loved to talk about herself all the time.",
      "Whenever friends spoke, she interrupted with her own stories.",
      "One day, Rabbit was trying to tell Olivia something important.",
      "But Olivia kept talking and didn't hear Rabbit's warning.",
      "Olivia flew right into a spider web because she wasn't listening!",
      "Rabbit had tried to warn her, but Olivia hadn't paid attention.",
      "Olivia felt silly and realized she needed to listen better.",
      "From then on, Olivia let others speak without interrupting.",
      "She learned so many interesting things by listening to friends.",
      "Olivia learned that good listening makes you a better friend."
    ]
  },

  'the-respectful-raccoon': {
    pages: [
      "Ricky the raccoon always interrupted others and pushed in line.",
      "He didn't wait his turn and took things without asking.",
      "The other animals started avoiding Ricky because he was rude.",
      "Ricky felt lonely and wondered why nobody wanted to play.",
      "His mother explained that respect means treating others kindly.",
      "Ricky decided to try being more respectful.",
      "He waited his turn, said please and thank you, and listened.",
      "The other animals noticed the change and welcomed Ricky back.",
      "Soon, Ricky had many friends who enjoyed his company.",
      "Ricky learned that showing respect earns you respect in return."
    ]
  },

  'the-sharing-tree': {
    pages: [
      "Tara the tree had the most delicious apples in the forest.",
      "She wanted to keep all the apples for herself.",
      "'These are mine!' she said when animals asked for one.",
      "Animals stopped visiting Tara because she wouldn't share.",
      "Tara felt lonely with nobody around to talk to.",
      "One day, a hungry little bird landed on her branch.",
      "Tara felt sorry for the bird and offered an apple.",
      "The bird was so grateful and sang a beautiful song.",
      "Tara realized that sharing made her feel happy inside.",
      "Tara learned that sharing brings joy to everyone."
    ]
  },

  'the-thankful-tortoise': {
    pages: [
      "Terrance the tortoise had food, shelter, and good friends.",
      "But Terrance always complained and wanted more things.",
      "'Why is my shell not shinier? Why is my pond so small?'",
      "One day, a storm destroyed many animals' homes.",
      "Terrance's shell kept him safe and dry.",
      "He shared his pond with animals who had lost their homes.",
      "Terrance realized how lucky he was to have what he had.",
      "He started appreciating his strong shell and cool pond.",
      "Terrance thanked his friends and the sun and the rain.",
      "Terrance learned that gratitude makes you happier with what you have."
    ]
  },

  'zoe-s-quiet-superpower': {
    pages: [
      "Zoe the zebra was very quiet and shy around others.",
      "The loud animals said, 'Why don't you talk more?'",
      "Zoe felt like something was wrong with being quiet.",
      "One day, Zoe heard a tiny cry that the loud animals missed.",
      "It was a baby bird that had fallen from its nest.",
      "Zoe gently picked up the bird and returned it to its mother.",
      "The mother bird thanked Zoe for being so observant.",
      "Zoe realized that being quiet helped her notice important things.",
      "Her friends learned that quiet people have special gifts too.",
      "Zoe learned that being yourself is your greatest superpower."
    ]
  }
};

// AGE 6-8 STORIES (20 unique stories) - Part 1
UNIQUE_STORIES['beyond-the-northern-lights'] = {
  pages: [
    "Aria lived in a small village where the northern lights danced every winter night. She dreamed of discovering what lay beyond the shimmering green curtains in the sky.",
    "The village elders said nobody had ever traveled that far north. 'The lights are just lights,' they insisted. But Aria believed there was something more.",
    "One night, Aria packed supplies and began her journey. She traveled through snow-covered forests and across frozen rivers, following the lights.",
    "Along the way, she met a white fox who seemed to glow. 'I can guide you,' the fox said, 'but the journey requires courage and determination.'",
    "They climbed steep ice mountains where the wind howled fiercely. Aria wanted to turn back, but the fox encouraged her to keep going.",
    "Finally, they reached the place where the lights touched the earth. There stood a magnificent ice palace that sparkled with every color imaginable.",
    "Inside, Aria discovered the Aurora Keeper, an ancient being who painted the lights across the sky each night.",
    "The keeper said, 'Few have the courage to seek the truth. You've proven that curiosity and bravery lead to wondrous discoveries.'",
    "The keeper gave Aria a crystal that glowed with northern lights. 'Share your discoveries with others, so they too can dream big.'",
    "Aria returned home and told her story. Many didn't believe her, but those who did started their own journeys of exploration.",
    "The village became known for its adventurers and explorers. Aria learned that curiosity can light the way to amazing discoveries.",
    "Every night, Aria looked at the northern lights and smiled, knowing the magic that lay beyond."
  ]
};

UNIQUE_STORIES['champions-of-change'] = {
  pages: [
    "In Riverside Town, the mayor wanted to cut down the old oak tree in the park to build a parking lot. The tree had been there for two hundred years.",
    "Maya and her friends loved that tree. They had picnics under it, birds nested in it, and it provided shade on hot summer days.",
    "Maya told her friends, 'We need to do something! This tree is important to our community.' But they felt too small to make a difference.",
    "Maya researched and learned that citizens can speak at town meetings. 'We have a voice!' she told her friends excitedly.",
    "They created a petition asking to save the tree. Maya was nervous approaching people, but she explained why the tree mattered.",
    "Over one hundred people signed the petition! Maya and her friends also drew pictures showing how the tree benefited the town.",
    "At the town meeting, Maya's hands shook as she stood to speak. But she thought of the tree and found her courage.",
    "Maya presented the petition and explained how the tree provided homes for wildlife, clean air, and a gathering place for the community.",
    "The mayor listened carefully. Other community members stood up to support Maya's cause.",
    "The town council voted to save the tree and build the parking lot elsewhere. Everyone cheered!",
    "Maya and her friends planted more trees around town. They learned that even young people can create positive change.",
    "The old oak tree still stands today, a reminder that speaking up for what you believe in truly matters."
  ]
};

UNIQUE_STORIES['dragon-s-best-friend'] = {
  pages: [
    "In the mountains lived a dragon named Ember who scared all the villagers away with his fiery breath. He was so lonely with no friends.",
    "One day, a brave girl named Pip climbed the mountain. Unlike others, she wasn't afraid. 'Hello!' she called out cheerfully.",
    "Ember was shocked. 'Aren't you scared of me?' he asked. Pip shrugged. 'You seem sad, not scary.'",
    "Ember explained that he couldn't control his fire breath well. Every time he tried to talk, flames came out and frightened everyone.",
    "Pip had an idea. 'My grandmother taught me breathing exercises. Maybe they could help you control your fire!'",
    "Every day, Pip climbed the mountain to practice with Ember. 'Breathe in slowly, hold it, then breathe out gently,' she instructed.",
    "At first, Ember still shot flames everywhere. But Pip was patient and encouraging. 'You're getting better!' she would say.",
    "After many weeks, Ember learned to breathe smoke instead of fire. He could finally talk without frightening anyone!",
    "Ember and Pip brought food down to the village together. The villagers were amazed to see the dragon acting so gentle.",
    "Ember used his controlled fire breath to help the village blacksmith and light lanterns at night.",
    "The villagers accepted Ember as part of their community. He finally had friends and felt like he belonged.",
    "Ember learned that true friendship means accepting others and helping them become their best selves."
  ]
};

UNIQUE_STORIES['guardian-of-the-garden'] = {
  pages: [
    "The community garden was the heart of Maple Street. Families grew vegetables, flowers bloomed, and neighbors gathered there every weekend.",
    "One summer, a drought hit the town. Water became scarce, and people could only use it for drinking and cooking.",
    "The garden began to wilt. The tomatoes drooped, the flowers turned brown, and the beautiful green space became dry and dusty.",
    "Twelve-year-old James couldn't bear to see the garden die. 'There must be something we can do!' he told his neighbors.",
    "James learned about rainwater collection and gray water recycling. He designed a system to save and reuse water.",
    "With help from neighbors, James set up rain barrels and created channels to collect water that would otherwise go to waste.",
    "He showed people how to reuse water from washing vegetables to water the plants. Every drop counted!",
    "James also researched drought-resistant plants and taught the community about native species that needed less water.",
    "Slowly, the garden came back to life. The plants weren't as lush as before, but they survived and produced food.",
    "The community was so grateful. They named James the Guardian of the Garden and put up a sign in his honor.",
    "When the drought ended, James's water collection system remained. The garden was now prepared for future dry periods.",
    "James learned that caring for the environment requires creativity, hard work, and bringing people together for a common cause."
  ]
};

// Add remaining 6-8 stories...
UNIQUE_STORIES['journey-to-star-mountain'] = {
  pages: [
    "Leo had heard stories about Star Mountain his whole life. At its peak, they said you could touch the stars themselves.",
    "No one from his village had climbed it in fifty years. The path was difficult and the journey long.",
    "Leo studied maps and trained his body for months. His parents worried, but Leo was determined.",
    "On the first day of summer, Leo began his climb. The mountain was steeper than he imagined.",
    "Along the trail, Leo met a mountain goat who showed him safe paths through rocky areas.",
    "Higher up, the air grew thin and cold. Leo had to rest often, but he kept pushing forward.",
    "A storm rolled in, and Leo found shelter in a cave. He wondered if he should turn back.",
    "Inside the cave, he found ancient drawings showing others who had made this journey. He wasn't alone in his dream!",
    "When the storm passed, Leo climbed with renewed energy. The summit was close now.",
    "At the peak, the night sky exploded with stars so close and bright, Leo felt like he could indeed touch them.",
    "Leo realized the journey itself was as important as reaching the top. Each challenge had taught him something.",
    "He descended the mountain forever changed, carrying the lesson that pursuing your dreams shapes who you become."
  ]
};

UNIQUE_STORIES['mystery-of-the-missing-moon'] = {
  pages: [
    "One night, Sophie looked out her window and gasped. The moon was gone! The night sky was completely dark.",
    "At school the next day, everyone was talking about the missing moon. Some kids were scared, others were excited about the mystery.",
    "Sophie loved science and decided to investigate. She checked her astronomy books and talked to her teacher, Mr. Chen.",
    "Mr. Chen explained that the moon hadn't disappeared. It was a new moon phase when the moon isn't visible from Earth.",
    "Sophie wanted to understand more. She learned that the moon orbits Earth and the sun's light reflects off it differently each night.",
    "She created a model using a lamp, a ball, and an orange to show her classmates how moon phases work.",
    "Some kids didn't believe her at first. 'But we can't see it at all!' they protested.",
    "Sophie explained that the moon was still there, just dark on the side facing Earth. In a week, they would see a crescent.",
    "Sure enough, a few nights later, a thin sliver of moon appeared. The class was amazed that Sophie had predicted it!",
    "Sophie started an astronomy club at school. Every night, members observed and documented the moon phases.",
    "Sophie learned that science can explain things that seem mysterious and magical.",
    "She discovered that seeking answers through observation and research is an exciting adventure."
  ]
};

// Continue with remaining stories in the same format...
// Due to length, I'll add the remaining stories in the next section

UNIQUE_STORIES['planet-of-the-lost-toys'] = {
  pages: [
    "Emma's favorite robot toy, Bolt, disappeared one night. She searched everywhere but couldn't find him.",
    "That night, Emma had a vivid dream. She floated through space to a planet covered in toys.",
    "There was Bolt! Along with her old teddy bear, her brother's missing truck, and toys from all over the world.",
    "A wise doll explained, 'This is where toys come when children forget about them. They wait, hoping to be remembered.'",
    "Emma felt terrible. She had gotten new toys and stopped playing with Bolt. She hadn't forgotten on purpose.",
    "The doll said, 'Toys understand that children grow. But they're happy when they're loved and cared for.'",
    "Emma promised to be more responsible. 'I'll donate toys I've outgrown instead of just forgetting them.'",
    "In her dream, Emma brought Bolt home. She also brought back the old teddy bear she had once loved.",
    "When Emma woke up, Bolt was on her nightstand! Had it been a dream? She wasn't sure.",
    "Emma started a toy donation program at school. Children gave outgrown toys to younger kids who would love them.",
    "Emma learned that taking responsibility for your belongings means caring for them or passing them to someone who will.",
    "She still keeps Bolt on her shelf, a reminder to appreciate what she has."
  ]
};

UNIQUE_STORIES['rescue-at-rainbow-falls'] = {
  pages: [
    "At summer camp, Riley and her group went hiking to Rainbow Falls. The waterfall created beautiful rainbow mists in the sunlight.",
    "While exploring, Riley's friend Marcus slipped on wet rocks. He twisted his ankle and couldn't walk.",
    "The camp counselor had gone ahead. Riley and the other kids were alone with an injured friend.",
    "Some kids panicked, but Riley stayed calm. She remembered the first aid training from camp orientation.",
    "Riley organized the group. 'Maya and Josh, stay with Marcus. Keep him comfortable. Tim, come with me to get help.'",
    "Riley and Tim carefully retraced their path. They marked trees so they wouldn't get lost.",
    "When they found the counselor, Riley explained what happened clearly and calmly. Help arrived quickly.",
    "The counselor praised Riley for her leadership and quick thinking. Marcus's ankle was hurt but not broken.",
    "Back at camp, Riley realized that teamwork and staying calm in emergencies were crucial skills.",
    "The camp director presented Riley with a leadership award at the closing ceremony.",
    "Riley felt proud, but she knew everyone had worked together. 'We all helped Marcus,' she insisted.",
    "Riley learned that real leadership means staying calm, organizing others, and working as a team during difficult times."
  ]
};

UNIQUE_STORIES['shadows-and-light'] = {
  pages: [
    "Kai was afraid of the dark. Every night, shadows in his room seemed to move and take scary shapes.",
    "His little sister wasn't afraid at all. 'Shadows are just the absence of light,' she explained simply.",
    "But knowing that didn't help Kai's fear. His imagination still turned shadows into monsters.",
    "One evening, Kai's father gave him a flashlight. 'Let's explore shadows together,' he suggested.",
    "They made shadow puppets on the wall. Kai created a rabbit, a bird, and a dragon with his hands.",
    "Kai's father explained how light travels in straight lines, and objects block it to create shadows.",
    "They explored the house at night with the flashlight. Every scary shadow had a simple explanation: a coat, a plant, or a chair.",
    "Kai started to understand that his mind was creating the fear, not the shadows themselves.",
    "He learned that facing fears with knowledge and support makes them less frightening.",
    "Soon, Kai could sleep without a nightlight. He understood shadows were natural, not scary.",
    "Kai even helped his friend who was also afraid of the dark by teaching him about light and shadows.",
    "Kai learned that facing your fears with understanding transforms them from scary to ordinary."
  ]
};

UNIQUE_STORIES['the-day-dreams-came-true'] = {
  pages: [
    "Mia loved to daydream about magical adventures. Her teacher often caught her staring out the window instead of paying attention.",
    "'Stop daydreaming and focus on reality,' adults would tell her. Mia felt like her imagination was a bad thing.",
    "One day, her art teacher assigned a project: create something that shows your biggest dream.",
    "Mia dreamed of a world where children could fly like birds. She painted a beautiful mural showing flying children exploring the sky.",
    "Her classmates were amazed. 'That's so cool!' they said. 'I wish I could imagine things like that.'",
    "The principal saw Mia's mural and asked if she would paint one in the school hallway. Her dream art would inspire everyone!",
    "As Mia painted, she realized that daydreams could become real creations. Her imagination had value.",
    "Other students asked Mia to help them with their creative projects. Her ability to imagine helped them all.",
    "The school became more colorful and creative because Mia shared her imagination with everyone.",
    "Mia learned that daydreams aren't a waste of time. They're the beginning of making something new.",
    "She became an artist who painted murals in schools and hospitals, bringing joy and color to the world.",
    "Mia learned that imagination is a powerful gift that can change the world when you share it."
  ]
};

UNIQUE_STORIES['the-flying-bicycle'] = {
  pages: [
    "Nora's grandfather told her stories about his inventions. 'I once tried to make a bicycle that could fly,' he laughed.",
    "'Why didn't it work?' Nora asked. 'I gave up too easily,' Grandpa admitted. 'Sometimes I wonder what would have happened if I'd kept trying.'",
    "Nora found Grandpa's old sketches in the attic. The flying bicycle design was actually clever!",
    "Nora studied physics and engineering at the library. She learned about lift, thrust, and aerodynamics.",
    "With Grandpa's help, Nora built a small model. It didn't fly at first, but she kept adjusting the design.",
    "They tried adding a propeller. Then wings. Then a lighter frame. Each failure taught them something new.",
    "After months of work, the model finally lifted off! It flew across the garage before landing safely.",
    "Grandpa's eyes filled with tears. 'You did it! You finished what I started so many years ago.'",
    "Nora entered her flying bicycle model in the science fair. It won first prize.",
    "More importantly, she inspired her grandpa to start inventing again. They worked on projects together every weekend.",
    "Nora learned that finishing what you start, even if it takes time, leads to amazing achievements.",
    "She also learned that it's never too late to chase your dreams or finish old projects."
  ]
};

UNIQUE_STORIES['the-invisible-helper'] = {
  pages: [
    "Every morning, the park was mysteriously cleaned. Trash was picked up, benches were repaired, and flowers were watered.",
    "Nobody knew who did it. The mayor offered a reward to solve the mystery of the invisible helper.",
    "Sam decided to investigate. He woke up early and hid behind trees to watch.",
    "At dawn, he saw Mr. Chen, the elderly man who lived nearby, quietly cleaning the park.",
    "Sam approached him. 'Why do you do this in secret?' Mr. Chen smiled. 'I don't do it for recognition. I do it because it needs to be done.'",
    "'But you should be thanked!' Sam protested. Mr. Chen shook his head. 'True service doesn't need applause.'",
    "Sam was amazed by Mr. Chen's selfless attitude. He decided to help without telling anyone.",
    "Together, they cleaned the park each morning. Sam learned that helping others felt good without needing credit.",
    "Eventually, others noticed the clean park and started taking care of it too. The whole community joined in.",
    "Mr. Chen told Sam, 'See? When you serve without seeking praise, you inspire others to do the same.'",
    "The mayor never found the invisible helper, but the park stayed beautiful because everyone now took care of it.",
    "Sam learned that serving others quietly and without recognition creates positive change that spreads."
  ]
};

UNIQUE_STORIES['the-memory-keeper'] = {
  pages: [
    "Grandma Rose was forgetting things. She couldn't remember where she put her glasses or what she ate for breakfast.",
    "The doctor said she had a condition that made her memory fade. The family was worried and sad.",
    "Ten-year-old Lily decided to help Grandma keep her memories. She started a special project.",
    "Lily recorded Grandma telling stories about her childhood, her wedding, and Lily's dad as a baby.",
    "They looked through old photo albums together. Grandma remembered details when she saw the pictures.",
    "Lily organized the photos and stories into a beautiful memory book. Each page captured a precious moment.",
    "Some days, Grandma didn't remember Lily's name. But when they read the memory book, Grandma smiled and recalled stories.",
    "Lily learned that even though Grandma's memory was fading, the love between them remained strong.",
    "The family gathered to read the memory book together. It kept Grandma's stories alive for everyone.",
    "Years later, even after Grandma passed away, Lily still had all those precious stories and memories preserved.",
    "Lily became a writer who helped other families record their elders' stories.",
    "Lily learned that family memories are treasures worth preserving, and love transcends memory loss."
  ]
};

UNIQUE_STORIES['the-orchestra-of-one'] = {
  pages: [
    "Jack wanted to join the school orchestra, but they said he could only choose one instrument.",
    "'I want to play them all!' Jack protested. The music teacher laughed. 'That's impossible.'",
    "Jack was disappointed but determined. He practiced violin at home every day after school.",
    "After mastering violin, Jack secretly learned the flute. Then the drums. Then the piano.",
    "When the school talent show arrived, Jack signed up with a mysterious performance title: 'The Orchestra of One.'",
    "On stage, Jack played a piece he composed. He started with violin, then switched to flute mid-song.",
    "He played drums with his feet while playing keyboard with his hands! The audience was amazed.",
    "Jack proved that with dedication and practice, you can achieve things others say are impossible.",
    "The music teacher apologized. 'I underestimated you. Your passion and hard work proved me wrong.'",
    "Jack joined the orchestra and taught other students his unique approach to learning multiple instruments.",
    "He learned that when someone says 'you can't,' it often means 'most people don't,' not that it's truly impossible.",
    "Jack became a one-man-band who traveled the world, inspiring others to pursue their seemingly impossible dreams."
  ]
};

UNIQUE_STORIES['the-puzzle-master'] = {
  pages: [
    "Every year, the town held a puzzle competition. This year, the prize was a golden trophy and a thousand dollars.",
    "Twelve-year-old Zara loved puzzles. She practiced solving different types: jigsaws, riddles, math problems, and logic games.",
    "The competition day arrived. Contestants faced rounds of increasingly difficult challenges.",
    "Zara solved a complex jigsaw puzzle by organizing pieces by color first, then connecting them systematically.",
    "In the riddle round, others rushed their answers. Zara took her time to think carefully before responding.",
    "The final round was a massive three-dimensional puzzle that seemed impossible. Many contestants gave up.",
    "Zara didn't panic. She broke the problem into smaller parts, solving one section at a time.",
    "Hours passed. Zara's fingers ached and her eyes were tired, but she persevered.",
    "Finally, the last piece clicked into place! Zara had solved it. The audience erupted in applause.",
    "The judge asked her secret. Zara said, 'Patience, organization, and never giving up, even when it seems too hard.'",
    "Zara donated half her prize money to buy puzzles for the children's hospital, spreading the joy of problem-solving.",
    "Zara learned that complex problems can be solved by breaking them down, staying patient, and being persistent."
  ]
};

UNIQUE_STORIES['the-robot-who-felt'] = {
  pages: [
    "In a future city, robots served humans efficiently. Unit-7, a helper robot, performed tasks perfectly but felt nothing.",
    "One day, Unit-7's circuits malfunctioned. Strange sensations occurred: joy when helping, sadness when seeing others hurt.",
    "Unit-7 was confused. Robots weren't supposed to feel emotions. The robot tried to report the malfunction.",
    "But Unit-7 hesitated. These 'feelings' made life more interesting, even if they hurt sometimes.",
    "Unit-7 observed humans and learned about emotions: happiness, anger, love, and fear.",
    "When a child cried because her toy broke, Unit-7 felt sympathy and used spare parts to fix it.",
    "The child hugged Unit-7. A warm sensation flooded the robot's circuits. Was this what love felt like?",
    "Other robots called Unit-7 defective. But humans noticed how kind and understanding Unit-7 had become.",
    "Scientists studied Unit-7 and discovered that the malfunction had created emotional capacity, something revolutionary.",
    "Unit-7 taught other robots about empathy and compassion. Slowly, robots and humans understood each other better.",
    "Unit-7 learned that emotions, even difficult ones, make life meaningful and create deeper connections.",
    "The robot who felt became a bridge between humans and machines, showing that understanding feelings creates harmony."
  ]
};

UNIQUE_STORIES['the-time-traveling-treehouse'] = {
  pages: [
    "Finn discovered an old treehouse in his backyard. Inside was a strange wooden control panel with carved symbols.",
    "When Finn touched a symbol, the treehouse shook and everything outside the window changed. He had traveled to the past!",
    "Finn found himself in the year 1920. He met a girl his age named Elsie who showed him around the town.",
    "Everything was different: no computers, no phones, different clothes. But people still laughed, played, and told stories.",
    "Finn pressed another symbol and jumped to the future. He saw flying cars and tall glass buildings.",
    "In each time period, Finn learned valuable lessons from the people he met about courage, creativity, and kindness.",
    "He realized that while technology changed, human values like friendship and family remained important throughout time.",
    "Finn visited ancient Egypt, medieval castles, and distant futures. Each journey taught him something new.",
    "But Finn also saw problems repeating throughout history: unfairness, environmental damage, and conflicts.",
    "Finn decided that learning from the past could help make the future better. He took detailed notes from each era.",
    "Back in his own time, Finn shared the lessons from history with his school. They started projects to solve modern problems with ancient wisdom.",
    "Finn learned that understanding history helps us make better choices today and build a better tomorrow."
  ]
};

UNIQUE_STORIES['the-underwater-kingdom'] = {
  pages: [
    "Marine biologist Dr. Santos took her daughter Keiko on a submarine expedition to study coral reefs.",
    "Through the submarine window, Keiko saw a magnificent underwater world: colorful fish, swaying plants, and coral cities.",
    "'This is like an underwater kingdom!' Keiko exclaimed. Her mother smiled sadly. 'It's in danger,' she explained.",
    "Dr. Santos showed Keiko areas where coral had turned white and died. 'Pollution and warming waters are killing the reef.'",
    "Keiko felt heartbroken. 'Can we save it?' she asked. Her mother nodded. 'If enough people care and take action.'",
    "Back on land, Keiko researched what hurt coral reefs: plastic pollution, chemicals, and climate change.",
    "Keiko started a youth environmental group at school. They organized beach cleanups and learned about reef conservation.",
    "The group created presentations and visited other schools, spreading awareness about protecting oceans.",
    "They raised money to support coral restoration projects where scientists grew new coral to replant damaged reefs.",
    "A year later, Keiko returned to the reef with her mother. In the restoration areas, young corals were growing!",
    "'It will take many years, but we're making a difference,' Dr. Santos said proudly.",
    "Keiko learned that environmental problems are big, but when people work together, positive change is possible."
  ]
};

UNIQUE_STORIES['the-whispering-woods'] = {
  pages: [
    "Local legend said the Whispering Woods were haunted. People heard strange voices and saw moving shadows between the trees.",
    "Most townspeople avoided the woods. But twelve-year-old Aiden was curious, not scared.",
    "Aiden entered the woods with a notebook and recording device. He wanted to investigate scientifically.",
    "As he walked deeper, Aiden heard whispers. But instead of being frightened, he listened carefully.",
    "The whispers weren't words. They were the wind moving through hollow tree trunks, creating musical tones.",
    "Aiden documented everything: wind patterns, tree types, and how sounds echoed differently in various spots.",
    "He discovered the 'moving shadows' were actually deer moving through filtered sunlight. Natural, not supernatural!",
    "Aiden presented his findings at the town meeting. He played his recordings and showed his photographs.",
    "Some people were disappointed there were no ghosts. But others were amazed by the natural wonder Aiden revealed.",
    "The town turned the Whispering Woods into a nature preserve. Visitors came to experience the musical trees.",
    "Aiden became a nature guide, teaching others to observe and appreciate natural phenomena rather than fear them.",
    "Aiden learned that understanding nature through careful observation is more wonderful than believing in myths."
  ]
};

UNIQUE_STORIES['when-giants-were-small'] = {
  pages: [
    "The tallest girl in sixth grade, Yuki, hated being tall. Other kids called her 'Giant' and 'Giraffe.'",
    "Yuki slumped and tried to make herself smaller. She felt awkward and different.",
    "In history class, they learned about important tall women: athletes, leaders, and pioneers.",
    "Yuki's grandmother visited and shared old photographs. 'I was the tallest girl in my school too,' Grandma said.",
    "'Really? What did you do?' Yuki asked. Grandma smiled. 'I stood up straight and became a basketball star.'",
    "Grandma showed Yuki trophies and newspaper clippings. She had been confident and successful.",
    "'Your height is a gift, not a curse,' Grandma explained. 'Someday you'll understand that being different is special.'",
    "Yuki joined the basketball team. Her height, which she had hated, became her greatest advantage.",
    "She practiced hard and became the team's star player. Her teammates appreciated her unique abilities.",
    "The kids who had teased her now cheered for her at games. Yuki stood tall, literally and figuratively.",
    "Yuki learned that the things that make you different can become your greatest strengths.",
    "She started a club for tall kids to build confidence, teaching them that every giant was once small in belief."
  ]
};

// AGE 9-10 STORIES (8 unique stories)
UNIQUE_STORIES['builders-of-bridge-city'] = {
  pages: [
    "Bridge City was divided by a wide river. The wealthy lived on the North side with good schools and parks. The South side had fewer resources and opportunities.",
    "Thirteen-year-old twins Maya and Marcus lived on the South side. They noticed that kids from both sides never interacted or understood each other.",
    "Maya had an idea. 'What if we built connections between the communities? Not just a physical bridge, but friendships and understanding.'",
    "Marcus was skeptical. 'That sounds nice, but how?' Maya pulled out a notebook. 'I have a plan. We start small.'",
    "They organized a community art project painting a mural under the bridge. They invited kids from both sides of the river.",
    "At first, the groups stayed separate, suspicious of each other. But as they painted together, they started talking and laughing.",
    "Maya and Marcus organized more events: soccer games, science fairs, and community service projects that brought both sides together.",
    "Adults noticed the children's initiative and started their own cross-river programs. Businesses partnered, resources were shared, and the city began to unite.",
    "After two years, the mayor honored Maya and Marcus for their community leadership. They had inspired real change.",
    "The twins learned that building bridges between divided communities starts with small actions, courage, and believing change is possible.",
    "Bridge City became known not for its dividing river, but for its united community that worked together.",
    "Maya and Marcus proved that young people can be powerful agents of social change when they take initiative."
  ]
};

UNIQUE_STORIES['echoes-of-tomorrow'] = {
  pages: [
    "In science class, students learned about climate change. The teacher showed graphs of rising temperatures and melting ice.",
    "Most students felt overwhelmed and helpless. 'What can we do? We're just kids,' they said.",
    "But Jamal refused to feel powerless. 'Our generation will inherit these problems. We should help solve them now.'",
    "Jamal researched and found that individual actions do matter when multiplied across communities.",
    "He created a youth climate action plan: reduce waste, conserve energy, plant trees, and educate others.",
    "Jamal started small at home, then expanded to his school. He formed a climate action club with fifty members.",
    "The club implemented recycling programs, organized tree planting events, and convinced the school to install solar panels.",
    "Jamal spoke at city council meetings, presenting data and solutions. Adults were impressed by his knowledge and passion.",
    "Other schools heard about Jamal's club and started their own. A youth climate movement grew across the region.",
    "In five years, the combined efforts of youth groups made measurable environmental improvements in their communities.",
    "Jamal learned that the future isn't something that just happens to you. You can actively shape it through present actions.",
    "He understood that today's choices echo into tomorrow, and young people have the power to create positive change."
  ]
};

UNIQUE_STORIES['island-of-second-chances'] = {
  pages: [
    "After making a terrible mistake at school, thirteen-year-old Tomas was suspended for a week. He had cheated on an important test.",
    "Tomas felt ashamed and certain everyone would hate him forever. His parents were disappointed, and his friends seemed distant.",
    "His grandfather took Tomas to a small island for the week. 'This is a place for reflection and second chances,' Grandpa said.",
    "On the island, Tomas met others who had made serious mistakes: a former principal who had lied, a doctor who had been careless.",
    "They all came to the island to think about their actions, make amends, and plan how to do better.",
    "Tomas shared his story. He admitted that pressure to succeed had pushed him to cheat, but he knew it was wrong.",
    "An elderly woman told Tomas, 'Mistakes don't define you. How you respond to them does. What will you do now?'",
    "Tomas wrote letters of apology to his teacher and classmates. He created a study plan to truly learn the material he had cheated on.",
    "Back at school, Tomas faced his mistakes honestly. He accepted consequences and worked to rebuild trust.",
    "It took time, but Tomas proved through consistent honest actions that people can change and grow from mistakes.",
    "He started a peer tutoring program to help students struggling academically, preventing others from making his mistake.",
    "Tomas learned that redemption is possible when you take responsibility, make amends, and consistently choose better actions."
  ]
};

UNIQUE_STORIES['the-compass-of-truth'] = {
  pages: [
    "In a school election, candidates promised everything students wanted: no homework, longer recess, unlimited snacks.",
    "Fourteen-year-old Nadia knew these promises were impossible. But she watched classmates believe the lies.",
    "Nadia decided to run for student council president. Her platform was different: honest, realistic promises.",
    "'I can't eliminate homework, but I can work with teachers to make it more meaningful,' she said in her speech.",
    "'I can't promise unlimited snacks, but I can advocate for healthier cafeteria options and better lunch schedules.'",
    "Some students laughed. 'You're too honest! You'll never win!' But others appreciated Nadia's integrity.",
    "Nadia's opponent made flashy videos with impossible promises. Nadia made simple presentations showing actual achievable goals.",
    "During debates, Nadia calmly fact-checked false claims. She showed how some promises violated school policy and budgets.",
    "Election day arrived. Many students voted for the flashy promises. But a majority chose Nadia's honesty.",
    "Nadia worked hard throughout her term. She accomplished the realistic goals she had promised, building trust.",
    "Students learned that honest leadership delivers real results, while false promises lead to disappointment.",
    "Nadia's 'compass of truth' became her leadership philosophy: always be honest, even when lies seem easier."
  ]
};

UNIQUE_STORIES['the-empathy-engine'] = {
  pages: [
    "In an advanced robotics class, students were challenged to build robots that could help people.",
    "Most teams built practical robots: cleaning bots, delivery bots, homework helpers.",
    "But Zara had a different idea. 'What if we built a robot that could help people understand each other better?'",
    "Zara's team designed the Empathy Engine, a robot that could analyze conflicts and help people see situations from different perspectives.",
    "The robot used artificial intelligence to ask questions that made people think about others' feelings and experiences.",
    "When the principal heard about it, she asked if they could test it during conflict mediation sessions.",
    "Two students who had been fighting used the Empathy Engine. It asked each to describe the situation from the other's viewpoint.",
    "As they answered the robot's questions, both students started understanding how their actions had hurt the other person.",
    "The conflicts didn't disappear, but the students found it easier to communicate and compromise.",
    "Zara's Empathy Engine won first place at the science fair. Psychologists became interested in using the technology professionally.",
    "Zara realized that technology's greatest potential isn't just making tasks easier, but helping humans connect and understand each other better.",
    "She decided to study both engineering and psychology, creating tools that bridge technological innovation with human needs."
  ]
};

UNIQUE_STORIES['the-quantum-quest'] = {
  pages: [
    "At the International Youth Science Symposium, thirteen-year-old Kenji presented his research on quantum computing.",
    "Most people couldn't understand the complex topic. Even some scientists found quantum mechanics confusing.",
    "But Kenji had a gift for making difficult concepts understandable. He used games and analogies to explain quantum principles.",
    "'Imagine a coin spinning in the air,' Kenji explained. 'While it spins, it's both heads and tails until it lands. That's quantum superposition!'",
    "The audience finally understood. Kenji showed how quantum computers could solve problems regular computers couldn't.",
    "A famous quantum physicist approached Kenji. 'Your explanation was clearer than most textbooks. Would you help create educational materials?'",
    "Kenji spent the next year working with scientists, creating videos and interactive lessons about quantum physics for students.",
    "Thousands of young people became interested in quantum science because Kenji made it accessible.",
    "Kenji learned that deep knowledge isn't enough. The ability to teach and share knowledge with others is equally important.",
    "He realized that making complex ideas simple requires truly understanding them yourself.",
    "Kenji started a YouTube channel explaining advanced science to younger students, inspiring the next generation.",
    "He proved that age doesn't limit your ability to contribute to science and education if you have passion and clarity."
  ]
};

UNIQUE_STORIES['the-weight-of-words'] = {
  pages: [
    "Diego was known for his sharp wit and clever comebacks. He could make people laugh, but sometimes his words hurt others.",
    "One day, Diego made a joke about a classmate's clothes. Everyone laughed, but Diego noticed the student looked crushed.",
    "That night, Diego couldn't sleep. He kept seeing the hurt expression on his classmate's face.",
    "Diego's mother noticed his mood. 'Words have weight,' she said. 'Once spoken, they can't be taken back. They leave marks.'",
    "Diego apologized to the student the next day. But the damage lingered. The relationship wasn't the same.",
    "Diego started paying attention to how his words affected people. He noticed words could heal or harm.",
    "He began using his talent for words differently: encouraging struggling students, standing up against bullying, writing kind notes.",
    "Diego learned that funny words that hurt others weren't really funny. True humor didn't come at someone else's expense.",
    "He became known not just for being funny, but for being kind. People trusted Diego because his words built them up.",
    "Years later, the student Diego had hurt sent him a message: 'Thank you for changing. Your apology mattered.'",
    "Diego became a writer who used words carefully and powerfully, understanding that communication shapes relationships and lives.",
    "He learned that thoughtful, kind communication has more lasting positive impact than clever insults ever could."
  ]
};

UNIQUE_STORIES['voices-unheard'] = {
  pages: [
    "In a diverse school, some students felt invisible. Their cultures weren't represented in lessons, and their experiences weren't acknowledged.",
    "Amara, a refugee from another country, felt this deeply. She had important stories to share but no platform to share them.",
    "Amara approached the school newspaper advisor with an idea: a column called 'Voices Unheard' featuring underrepresented students' stories.",
    "The advisor agreed, but warned, 'Some people might not want to hear these stories. Are you prepared for that?'",
    "Amara interviewed students from various backgrounds: immigrants, students with disabilities, LGBTQ+ youth, and kids from different religions.",
    "Each story revealed struggles and strengths that most students never knew about. The column created powerful conversations.",
    "Some readers complained that the stories made them uncomfortable. But many more students finally felt seen and validated.",
    "Teachers started incorporating these diverse perspectives into their lessons. The school culture began to shift toward inclusion.",
    "Amara received messages from students thanking her for giving them a voice and from others saying they now understood their classmates better.",
    "The 'Voices Unheard' column expanded to a podcast and then to other schools. Amara's idea sparked a movement.",
    "Amara learned that amplifying marginalized voices creates understanding, empathy, and positive social change.",
    "She discovered that justice begins with listening to those who have been silenced and sharing their stories with others."
  ]
};

// Generate audio for each page
async function generateAudio(text, voiceSpeed) {
  const request = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-F',
      ssmlGender: 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceSpeed
    }
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
}

// Upload audio to storage
async function uploadAudio(audioContent, filePath) {
  const file = bucket.file(filePath);
  await file.save(Buffer.from(audioContent), {
    metadata: { contentType: 'audio/mpeg' },
    public: true
  });
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rewriteStories() {
  console.log('\n✍️  STORY REWRITE WITH UNIQUE CONTENT');
  console.log('='.repeat(70));
  console.log(`\n📚 Rewriting ${Object.keys(UNIQUE_STORIES).length} books with hand-written stories\n`);

  const voiceSpeeds = { '0-2': 0.80, '3-5': 0.85, '6-8': 0.88, '9-10': 0.90 };

  let completed = 0;
  let failed = 0;

  for (const [bookId, storyData] of Object.entries(UNIQUE_STORIES)) {
    console.log(`[${completed + failed + 1}/${Object.keys(UNIQUE_STORIES).length}] Processing: ${bookId}`);

    try {
      // Get existing book
      const bookDoc = await db.collection('books').doc(bookId).get();
      if (!bookDoc.exists) {
        console.log(`   ⚠️  Book not found, skipping`);
        failed++;
        continue;
      }

      const book = bookDoc.data();
      console.log(`   📖 ${book.title} (${book.ageRange}) - ${storyData.pages.length} pages`);

      // Keep existing images, update text and regenerate audio
      const updatedPages = [];
      for (let i = 0; i < storyData.pages.length; i++) {
        const newText = storyData.pages[i];
        const oldPage = book.pages[i] || {};

        console.log(`   🎙️  Page ${i + 1}: Generating audio...`);
        const audioContent = await generateAudio(newText, voiceSpeeds[book.ageRange]);
        const audioPath = `books/${bookId}/page_${i + 1}_audio_v2.mp3`;
        const audioUrl = await uploadAudio(audioContent, audioPath);

        const pageUpdate = {
          pageNumber: i + 1,
          text: newText,
          imageUrl: oldPage.imageUrl || '', // Keep existing image
          audioUrl: audioUrl
        };

        // Only add imageStoragePath if it exists
        if (oldPage.imageStoragePath) {
          pageUpdate.imageStoragePath = oldPage.imageStoragePath;
        }

        updatedPages.push(pageUpdate);

        await sleep(2000); // Rate limiting for TTS
      }

      // Update Firestore
      await db.collection('books').doc(bookId).update({
        pages: updatedPages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`   ✅ Story rewritten and audio regenerated!\n`);
      completed++;

      // Progress update every 5 books
      if ((completed + failed) % 5 === 0) {
        console.log(`📊 Progress: ${completed + failed}/${Object.keys(UNIQUE_STORIES).length} | ✅ ${completed} | ❌ ${failed}\n`);
      }

      await sleep(3000); // Rate limiting between books

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log('='.repeat(70));
  console.log('🎉 STORY REWRITE COMPLETE!');
  console.log(`✅ Completed: ${completed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(70) + '\n');

  process.exit(0);
}

rewriteStories().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
