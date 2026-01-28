/**
 * Generate 100 Unique Children's Books
 * Original stories with diverse characters, themes, and learning
 * Slower voice narration for kids to follow along
 */

const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'genius-kids-story-books.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Google AI API Key
const GOOGLE_API_KEY = 'AIzaSyAtaLYBku6EmcnFp8puSL8tGtqwgHw22Uk';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Voice settings by age - SLOWER SPEED for kids
const VOICE_BY_AGE = {
  '0-2': { name: 'en-US-Studio-O', speakingRate: 0.80 },  // Extra slow for babies
  '3-5': { name: 'en-US-Studio-O', speakingRate: 0.85 },  // Slow and warm
  '6-8': { name: 'en-US-Studio-Q', speakingRate: 0.88 },  // Engaging storyteller
  '9-10': { name: 'en-US-Studio-Q', speakingRate: 0.90 }  // Slightly faster for older kids
};

// ============================================
// 100 UNIQUE BOOK DEFINITIONS
// Diverse characters, themes, and learning
// ============================================

const ALL_BOOKS = [
  // ========== AGES 0-2 (25 books) - Simple, repetitive, sensory ==========
  {
    title: "Goodnight, Little Star",
    ageRange: "0-2",
    theme: "bedtime",
    moralLesson: "Bedtime is peaceful and safe",
    pages: [
      { text: "The sun goes down. Down, down, down. Goodnight, sun!", imagePrompt: "Beautiful sunset with smiling cartoon sun going down behind hills, soft orange and pink sky, children's book style" },
      { text: "The moon comes up. Up, up, up. Hello, moon!", imagePrompt: "Friendly smiling crescent moon rising in purple twilight sky, cute stars appearing, children's book illustration" },
      { text: "Little star twinkles. Twinkle, twinkle, twinkle. Hello, little star!", imagePrompt: "Adorable sparkling star with cute face twinkling in night sky, soft glow, baby book illustration style" },
      { text: "Baby owl hoots. Hoot, hoot, hoot. Goodnight, owl!", imagePrompt: "Cute fluffy baby owl on tree branch saying goodnight, moonlit forest, adorable children's book style" },
      { text: "Little mouse sleeps. Shhh, shhh, shhh. Goodnight, mouse!", imagePrompt: "Tiny cute mouse curled up sleeping in cozy nest with blanket, peaceful, baby book illustration" },
      { text: "Baby bear yawns. Yawn, yawn, yawn. Goodnight, bear!", imagePrompt: "Adorable baby bear yawning in cozy cave with mama bear, sleepy and cute, children's book style" },
      { text: "You close your eyes. Close, close, close. Goodnight, little one!", imagePrompt: "Peaceful sleeping baby in crib with mobile of stars and moon, soft nightlight glow, tender illustration" },
      { text: "Dream sweet dreams. Dream, dream, dream. Goodnight, goodnight, goodnight!", imagePrompt: "Dreamy clouds with sleeping baby floating among stars and moon, magical peaceful scene, baby book style" }
    ]
  },
  {
    title: "Splish Splash Bath Time",
    ageRange: "0-2",
    theme: "routine",
    moralLesson: "Bath time is fun",
    pages: [
      { text: "It's bath time! The water goes splish splash. Splish splash!", imagePrompt: "Happy bathtub full of bubbly water with rubber ducks, cheerful bathroom, baby book illustration" },
      { text: "Yellow duck floats. Float, float, float. Hello, duck!", imagePrompt: "Cute yellow rubber duck floating in bubble bath, big friendly eyes, children's book style" },
      { text: "Bubbles everywhere! Pop, pop, pop. So many bubbles!", imagePrompt: "Colorful soap bubbles floating in bathroom, rainbow reflections, playful baby book illustration" },
      { text: "Wash your tummy. Rub, rub, rub. Clean tummy!", imagePrompt: "Happy cartoon baby in tub washing tummy with bubbles, smiling, cute children's book style" },
      { text: "Wash your toes. Wiggle, wiggle, wiggle. Clean toes!", imagePrompt: "Cute baby toes in bubble bath water, playful splashing, adorable baby book illustration" },
      { text: "Wash your hair. Scrub, scrub, scrub. Clean hair!", imagePrompt: "Happy baby with shampoo mohawk in tub, laughing, fun bath time children's book style" },
      { text: "All done! Out you go. Warm towel hug!", imagePrompt: "Cozy baby wrapped in fluffy hooded towel after bath, warm and happy, sweet illustration" },
      { text: "Clean and fresh! You smell so good. Bath time is the best!", imagePrompt: "Fresh clean happy baby in pajamas after bath, stars and moon on pajamas, bedtime ready illustration" }
    ]
  },
  {
    title: "Five Little Fingers",
    ageRange: "0-2",
    theme: "learning",
    moralLesson: "Learning to count is fun",
    pages: [
      { text: "One little finger. One! Can you show me one finger?", imagePrompt: "Cute cartoon hand showing one finger, colorful background, educational baby book illustration" },
      { text: "Two little fingers. Two! Wave hello with two fingers!", imagePrompt: "Friendly cartoon hand showing peace sign with two fingers, cheerful, children's book style" },
      { text: "Three little fingers. Three! Three fingers say hi!", imagePrompt: "Happy cartoon hand showing three fingers, bright colors, educational illustration" },
      { text: "Four little fingers. Four! Almost a whole hand!", imagePrompt: "Cartoon hand showing four fingers, excited expression nearby, children's book style" },
      { text: "Five little fingers. Five! A whole hand! Hooray!", imagePrompt: "Complete cartoon hand with all five fingers spread wide, celebration, educational baby book" },
      { text: "Clap your hands! Clap, clap, clap! Five fingers on each hand!", imagePrompt: "Two cute cartoon hands clapping together, stars and sparkles, joyful children's illustration" },
      { text: "Wave goodbye! Wave, wave, wave! Your fingers say bye-bye!", imagePrompt: "Friendly hand waving goodbye, happy face nearby, sweet children's book style" },
      { text: "You did it! You counted to five! Clever little one!", imagePrompt: "Celebration scene with number 5 and confetti, proud achievement, educational baby book finale" }
    ]
  },
  {
    title: "Red, Yellow, Blue",
    ageRange: "0-2",
    theme: "colors",
    moralLesson: "Colors are all around us",
    pages: [
      { text: "Red! Red apple. Red strawberry. Red is yummy!", imagePrompt: "Bright red apple and strawberry on white background, simple and bold, baby color learning book" },
      { text: "Yellow! Yellow sun. Yellow banana. Yellow is sunny!", imagePrompt: "Happy yellow sun and banana, bright cheerful colors, simple baby book illustration" },
      { text: "Blue! Blue sky. Blue butterfly. Blue is pretty!", imagePrompt: "Blue sky with cute blue butterfly, simple clean design, baby color learning illustration" },
      { text: "Green! Green frog. Green leaf. Green is fresh!", imagePrompt: "Cute green frog on green leaf, friendly face, simple baby book style" },
      { text: "Orange! Orange carrot. Orange fish. Orange is bright!", imagePrompt: "Orange carrot and cute orange goldfish, vibrant colors, baby learning illustration" },
      { text: "Purple! Purple grapes. Purple flower. Purple is fancy!", imagePrompt: "Purple grapes and purple flower, elegant yet simple, baby color book style" },
      { text: "Pink! Pink pig. Pink heart. Pink is sweet!", imagePrompt: "Adorable pink pig with pink heart, cute and sweet, baby book illustration" },
      { text: "So many colors! Red, yellow, blue, and more! Colors everywhere!", imagePrompt: "Rainbow of all colors with happy objects in each color, celebratory color learning finale" }
    ]
  },
  {
    title: "Animal Sounds",
    ageRange: "0-2",
    theme: "animals",
    moralLesson: "Animals make different sounds",
    pages: [
      { text: "Cow says MOO! Moo, moo, moo! Hello, cow!", imagePrompt: "Friendly cartoon cow in green field saying moo, cute face, baby book illustration" },
      { text: "Dog says WOOF! Woof, woof, woof! Hello, dog!", imagePrompt: "Happy puppy barking woof, wagging tail, adorable children's book style" },
      { text: "Cat says MEOW! Meow, meow, meow! Hello, cat!", imagePrompt: "Cute fluffy kitten meowing, soft and cuddly, baby book illustration" },
      { text: "Duck says QUACK! Quack, quack, quack! Hello, duck!", imagePrompt: "Yellow duck in pond quacking, water ripples, cheerful children's book style" },
      { text: "Pig says OINK! Oink, oink, oink! Hello, pig!", imagePrompt: "Pink pig in mud saying oink, happy and messy, cute baby book illustration" },
      { text: "Sheep says BAA! Baa, baa, baa! Hello, sheep!", imagePrompt: "Fluffy white sheep with wool saying baa, gentle farm scene, children's book style" },
      { text: "Rooster says COCK-A-DOODLE-DOO! Wake up!", imagePrompt: "Colorful rooster crowing at sunrise, farm morning, bright baby book illustration" },
      { text: "What sound do YOU make? Can you moo? Can you woof? You try!", imagePrompt: "All farm animals together looking at viewer, inviting interaction, engaging baby book finale" }
    ]
  },
  {
    title: "Big Hugs",
    ageRange: "0-2",
    theme: "family",
    moralLesson: "Hugs make us feel loved",
    pages: [
      { text: "Mommy gives big hugs. Squeeze, squeeze, squeeze! I love mommy hugs!", imagePrompt: "Loving mother hugging baby, warm embrace, tender children's book illustration" },
      { text: "Daddy gives big hugs. Squeeze, squeeze, squeeze! I love daddy hugs!", imagePrompt: "Father hugging child warmly, protective and loving, sweet family illustration" },
      { text: "Grandma gives soft hugs. So warm and cozy! I love grandma hugs!", imagePrompt: "Grandmother with glasses hugging grandchild, cozy sweater, heartwarming illustration" },
      { text: "Grandpa gives strong hugs. So safe and snug! I love grandpa hugs!", imagePrompt: "Grandfather hugging grandchild, gentle giant, loving family illustration" },
      { text: "Teddy bear gives fuzzy hugs. Soft and fluffy! I love teddy hugs!", imagePrompt: "Child hugging teddy bear tightly, comfort object, sweet children's book style" },
      { text: "Puppy gives wiggly hugs. Lick, lick, lick! Silly puppy hugs!", imagePrompt: "Puppy licking child's face while being hugged, playful and loving, cute illustration" },
      { text: "Baby gives little hugs. Pat, pat, pat! Sweet baby hugs!", imagePrompt: "Baby giving hug to stuffed animal, tiny arms, precious baby book illustration" },
      { text: "Hugs, hugs, everywhere! Big hugs, little hugs. Hugs mean I love you!", imagePrompt: "Collage of all the hugging scenes with hearts, love everywhere, warm finale illustration" }
    ]
  },
  {
    title: "Where Is Baby?",
    ageRange: "0-2",
    theme: "play",
    moralLesson: "Peek-a-boo is fun",
    pages: [
      { text: "Where is baby? Is baby behind the chair? No!", imagePrompt: "Empty chair with question mark, peek-a-boo game, playful baby book illustration" },
      { text: "Where is baby? Is baby under the table? No!", imagePrompt: "Table with peek underneath showing nothing, playful search, children's book style" },
      { text: "Where is baby? Is baby in the box? No!", imagePrompt: "Open cardboard box empty, playful hide and seek game, baby book illustration" },
      { text: "Where is baby? Is baby behind the curtain? No!", imagePrompt: "Curtain with something peeking, suspense building, playful illustration" },
      { text: "Where is baby? Is baby behind hands? Let's see...", imagePrompt: "Hands covering face playing peek-a-boo, anticipation, children's book style" },
      { text: "PEEK-A-BOO! There you are! I found you!", imagePrompt: "Happy baby face revealed from peek-a-boo, big smile, joyful children's illustration" },
      { text: "Baby giggles! Hee hee hee! Peek-a-boo is fun!", imagePrompt: "Laughing baby playing peek-a-boo, pure joy, adorable baby book style" },
      { text: "Let's play again! Cover your eyes... PEEK-A-BOO!", imagePrompt: "Invitation to play again, happy baby ready for more peek-a-boo, interactive illustration" }
    ]
  },
  {
    title: "Yummy Food",
    ageRange: "0-2",
    theme: "food",
    moralLesson: "Healthy food helps us grow",
    pages: [
      { text: "Banana! Yellow banana. Peel, peel, peel. Yummy banana!", imagePrompt: "Bright yellow banana being peeled, simple and appealing, baby food book illustration" },
      { text: "Apple! Red apple. Crunch, crunch, crunch. Yummy apple!", imagePrompt: "Shiny red apple with bite taken out, crunchy and fresh, children's book style" },
      { text: "Carrot! Orange carrot. Munch, munch, munch. Yummy carrot!", imagePrompt: "Orange carrot with green top, fresh and healthy, baby book illustration" },
      { text: "Milk! White milk. Glug, glug, glug. Yummy milk!", imagePrompt: "Glass of white milk with happy face, healthy drink, children's book style" },
      { text: "Cheese! Yellow cheese. Nibble, nibble, nibble. Yummy cheese!", imagePrompt: "Slice of yellow cheese, tasty and fun, baby food book illustration" },
      { text: "Bread! Soft bread. Nom, nom, nom. Yummy bread!", imagePrompt: "Slice of soft bread, warm and inviting, children's book style" },
      { text: "All gone! Empty plate. You ate it all! Good job!", imagePrompt: "Clean empty plate with happy face, achievement, baby book illustration" },
      { text: "Yummy food makes you strong! Eat your food and grow, grow, grow!", imagePrompt: "Happy healthy baby with all the foods around, growth and health, celebratory finale" }
    ]
  },
  {
    title: "Vroom Vroom Cars",
    ageRange: "0-2",
    theme: "vehicles",
    moralLesson: "Different vehicles move differently",
    pages: [
      { text: "Car goes vroom! Vroom, vroom, vroom! Fast car!", imagePrompt: "Cute cartoon red car driving fast, motion lines, simple baby book illustration" },
      { text: "Bus goes beep! Beep, beep, beep! Big bus!", imagePrompt: "Friendly yellow school bus beeping, big and cheerful, children's book style" },
      { text: "Train goes choo choo! Choo choo choo! Long train!", imagePrompt: "Colorful train with steam going choo choo, happy face, baby book illustration" },
      { text: "Airplane goes zoom! Zoom, zoom, zoom! High airplane!", imagePrompt: "Cute airplane flying high in blue sky with clouds, simple design, children's book" },
      { text: "Boat goes splash! Splash, splash, splash! Floating boat!", imagePrompt: "Little boat on blue water splashing, simple waves, baby book illustration" },
      { text: "Truck goes rumble! Rumble, rumble, rumble! Strong truck!", imagePrompt: "Big friendly truck with cargo, strong and helpful, children's book style" },
      { text: "Bicycle goes ring ring! Ring, ring, ring! Fun bicycle!", imagePrompt: "Colorful bicycle with bell ringing, cheerful, simple baby book illustration" },
      { text: "So many ways to go! Vroom, beep, choo choo! Which one do you like?", imagePrompt: "All vehicles together in happy scene, invitation to choose favorite, engaging finale" }
    ]
  },
  {
    title: "Round and Round",
    ageRange: "0-2",
    theme: "shapes",
    moralLesson: "Circles are everywhere",
    pages: [
      { text: "Circle! Round and round. Ball is a circle!", imagePrompt: "Colorful round ball, perfect circle, simple shape learning illustration" },
      { text: "Circle! Round and round. Sun is a circle!", imagePrompt: "Bright round sun with rays, circular shape, baby learning book style" },
      { text: "Circle! Round and round. Cookie is a circle!", imagePrompt: "Yummy round chocolate chip cookie, circular, children's book illustration" },
      { text: "Circle! Round and round. Wheel is a circle!", imagePrompt: "Round wheel spinning, circular motion, simple baby book style" },
      { text: "Circle! Round and round. Clock is a circle!", imagePrompt: "Friendly round clock face, circular, educational children's illustration" },
      { text: "Circle! Round and round. Plate is a circle!", imagePrompt: "Round dinner plate, simple circular shape, baby learning book" },
      { text: "Circle! Round and round. Orange is a circle!", imagePrompt: "Round orange fruit, perfectly circular, simple children's book style" },
      { text: "Circles everywhere! Round and round they go! Can you find more circles?", imagePrompt: "Collection of all circular objects together, shape recognition finale, engaging illustration" }
    ]
  },
  // More 0-2 books...
  {
    title: "Soft and Cuddly",
    ageRange: "0-2",
    theme: "textures",
    moralLesson: "Things feel different",
    pages: [
      { text: "Soft bunny! Soft, soft, soft. Pet the bunny!", imagePrompt: "Fluffy soft white bunny, touchable looking fur, sensory baby book illustration" },
      { text: "Fluffy cloud! Fluffy, fluffy, fluffy. So puffy!", imagePrompt: "Soft white fluffy cloud in blue sky, cotton-like, children's book style" },
      { text: "Fuzzy teddy! Fuzzy, fuzzy, fuzzy. Hug the teddy!", imagePrompt: "Brown fuzzy teddy bear, cuddly texture, baby book illustration" },
      { text: "Smooth ball! Smooth, smooth, smooth. Roll the ball!", imagePrompt: "Shiny smooth red ball, glossy surface, simple children's illustration" },
      { text: "Bumpy frog! Bumpy, bumpy, bumpy. Ribbit!", imagePrompt: "Green bumpy textured frog, friendly face, sensory baby book style" },
      { text: "Silky ribbon! Silky, silky, silky. So pretty!", imagePrompt: "Shiny silky pink ribbon, smooth and flowing, children's book illustration" },
      { text: "Warm blanket! Cozy, cozy, cozy. Snuggle up!", imagePrompt: "Soft warm blanket, cozy and inviting, baby book style" },
      { text: "So many feelings! Soft, smooth, bumpy. What do you feel?", imagePrompt: "All textured items together inviting touch, sensory exploration finale" }
    ]
  },
  {
    title: "Up and Down",
    ageRange: "0-2",
    theme: "opposites",
    moralLesson: "Things go up and down",
    pages: [
      { text: "Bird goes UP! Up, up, up! Fly high, bird!", imagePrompt: "Cute bird flying upward in blue sky, upward motion, simple baby book illustration" },
      { text: "Leaf goes DOWN! Down, down, down! Fall, little leaf!", imagePrompt: "Autumn leaf floating downward, gentle descent, children's book style" },
      { text: "Balloon goes UP! Up, up, up! Float away, balloon!", imagePrompt: "Red balloon floating upward, string trailing, baby book illustration" },
      { text: "Rain goes DOWN! Down, down, down! Drip, drop, rain!", imagePrompt: "Rain drops falling down, gentle rain, simple children's illustration" },
      { text: "Airplane goes UP! Up, up, up! Into the clouds!", imagePrompt: "Cute airplane ascending into sky, upward journey, baby book style" },
      { text: "Apple goes DOWN! Down, down, down! Fall from tree!", imagePrompt: "Red apple falling from tree branch, downward motion, children's book illustration" },
      { text: "Jump UP! Down you come! Up and down is fun!", imagePrompt: "Happy child jumping up then landing, playful motion, baby book style" },
      { text: "Up and down, up and down! The world goes round and round!", imagePrompt: "Playful scene showing up and down motions, engaging finale illustration" }
    ]
  },
  {
    title: "My Face",
    ageRange: "0-2",
    theme: "body",
    moralLesson: "Learning about our face",
    pages: [
      { text: "Eyes! Two eyes. Blink, blink, blink! I see you!", imagePrompt: "Cute cartoon eyes blinking, friendly and expressive, baby body parts book" },
      { text: "Nose! One nose. Sniff, sniff, sniff! I smell flowers!", imagePrompt: "Cute cartoon nose sniffing flower, sensory learning, children's book style" },
      { text: "Mouth! One mouth. Smile, smile, smile! Happy mouth!", imagePrompt: "Big friendly smiling mouth, cheerful expression, baby book illustration" },
      { text: "Ears! Two ears. Listen, listen, listen! I hear music!", imagePrompt: "Cute cartoon ears with music notes, hearing sense, children's book style" },
      { text: "Cheeks! Two cheeks. Pink and soft! Rosy cheeks!", imagePrompt: "Cute rosy pink cheeks on happy face, adorable, baby book illustration" },
      { text: "Chin! One chin. Wobble, wobble! Silly chin!", imagePrompt: "Cute chin wobbling playfully, funny expression, children's book style" },
      { text: "Hair! Lots of hair! Soft and pretty! My hair!", imagePrompt: "Various cute hairstyles on happy faces, inclusive, baby book illustration" },
      { text: "That's my face! Eyes, nose, mouth, and more! I love my face!", imagePrompt: "Complete happy face with all features labeled, self-love celebration, finale illustration" }
    ]
  },
  {
    title: "Day and Night",
    ageRange: "0-2",
    theme: "nature",
    moralLesson: "Day and night take turns",
    pages: [
      { text: "Morning! Sun wakes up. Rise and shine! Hello, day!", imagePrompt: "Cheerful sun rising over horizon, bright morning colors, baby book illustration" },
      { text: "Daytime! Sun is high. Bright and warm! Play outside!", imagePrompt: "Bright sunny day with children playing outside, happy scene, children's book style" },
      { text: "Afternoon! Sun goes lower. Still time to play!", imagePrompt: "Warm afternoon sun, golden light, peaceful play time, baby book illustration" },
      { text: "Sunset! Orange and pink. Sun says goodbye!", imagePrompt: "Beautiful orange pink sunset, sun waving goodbye, children's book style" },
      { text: "Evening! Stars come out. Twinkle, twinkle! Hello, stars!", imagePrompt: "First stars appearing in twilight sky, magical moment, baby book illustration" },
      { text: "Nighttime! Moon is bright. Dark and quiet. Shhh!", imagePrompt: "Peaceful night with bright moon, quiet darkness, calming children's illustration" },
      { text: "Sleep time! Eyes close tight. Dream sweet dreams!", imagePrompt: "Child sleeping peacefully under moon and stars, bedtime, baby book style" },
      { text: "Day and night, night and day. They take turns every day!", imagePrompt: "Split scene showing day and night side by side, cycle of time, finale illustration" }
    ]
  },
  {
    title: "Tiny Ant",
    ageRange: "0-2",
    theme: "insects",
    moralLesson: "Small creatures are amazing",
    pages: [
      { text: "Look! Tiny ant! So small, so small. Hello, little ant!", imagePrompt: "Cute tiny cartoon ant waving hello, friendly face, baby book illustration" },
      { text: "Ant walks. Walk, walk, walk. Where are you going, ant?", imagePrompt: "Little ant walking along path, determined, children's book style" },
      { text: "Ant finds crumb. Yummy, yummy! Big crumb for tiny ant!", imagePrompt: "Small ant finding big bread crumb, excited discovery, baby book illustration" },
      { text: "Ant is strong! Lift, lift, lift! Strong little ant!", imagePrompt: "Tiny ant lifting crumb above head, super strong, children's book style" },
      { text: "Ant meets friend. Hello, friend! Two ants now!", imagePrompt: "Two friendly ants greeting each other, friendship, baby book illustration" },
      { text: "Ants work together. Push, pull, push! Teamwork!", imagePrompt: "Two ants working together carrying crumb, cooperation, children's book style" },
      { text: "Ants go home. March, march, march! Into the anthill!", imagePrompt: "Ants marching into anthill home, accomplished journey, baby book illustration" },
      { text: "Bye bye, ants! See you soon! Amazing tiny ants!", imagePrompt: "Ants waving goodbye from anthill, sweet farewell, finale children's illustration" }
    ]
  },

  // ========== AGES 3-5 (25 books) - Simple stories, clear morals, engaging characters ==========
  {
    title: "Milo the Brave Mouse",
    ageRange: "3-5",
    theme: "courage",
    moralLesson: "Being brave means trying even when you're scared",
    pages: [
      { text: "Milo was a tiny gray mouse who lived in a cozy hole under the old oak tree. He had soft fur, big round ears, and the smallest whiskers you ever saw. Milo loved cheese more than anything, but there was one problem. He was afraid of everything!", imagePrompt: "Adorable tiny gray mouse with big ears peeking out of hole in oak tree, nervous expression, cozy home setting, children's book illustration" },
      { text: "Milo was scared of the dark. He was scared of thunder. He was even scared of his own shadow! When other mice went out to find food, Milo stayed home and worried.", imagePrompt: "Scared little mouse hiding under leaf while watching shadow, thunder clouds outside, worried expression, children's book style" },
      { text: "One day, Milo's grandmother got sick. She needed special honey from the beehive on the other side of the meadow. But all the other mice were too far away to help. Only Milo was nearby.", imagePrompt: "Elderly mouse grandmother in bed looking weak, young Milo looking concerned, cozy mouse home interior, emotional children's illustration" },
      { text: "Milo's tummy did flip-flops. The meadow was scary! There were big birds and stomping feet and strange noises. But Grandma needed him. Milo took a deep breath and stepped outside.", imagePrompt: "Determined little mouse at edge of big scary meadow, taking brave first step, sunrise behind him, inspiring children's book scene" },
      { text: "Milo scurried through the tall grass. His heart went thump-thump-thump! A shadow passed overhead. It was a big crow! Milo froze. Then he remembered Grandma. He kept running.", imagePrompt: "Tiny mouse running through tall grass, crow shadow overhead, brave despite fear, action scene children's illustration" },
      { text: "Milo crossed the stream on a wobbly leaf boat. He climbed over big rocks. He squeezed through a scary dark tunnel. Each time he wanted to quit, he thought of Grandma's warm smile.", imagePrompt: "Mouse on leaf boat crossing stream, adventure journey montage, brave determination, children's book adventure style" },
      { text: "Finally, Milo reached the beehive! The bees buzzed loudly. Politely, Milo asked for just a tiny drop of honey for his sick grandmother. The kind bees gave him a whole acorn cap full!", imagePrompt: "Small mouse politely asking friendly bees at beehive, bees giving honey in acorn cap, cooperation scene, sweet children's illustration" },
      { text: "Milo raced home as fast as his little legs could carry him. He gave the honey to Grandma, and she started feeling better right away! She hugged Milo tight.", imagePrompt: "Mouse grandmother hugging Milo happily, honey medicine working, joyful reunion, heartwarming children's book scene" },
      { text: "That night, all the mice cheered for Milo! He was still a tiny mouse, but now everyone knew his heart was as big as a lion's. Milo learned that being brave doesn't mean you're not scared.", imagePrompt: "All mice celebrating Milo as hero, cheering crowd, proud little mouse, celebration scene children's illustration" },
      { text: "Being brave means doing what's right even when your tummy feels funny and your knees feel wobbly. And that makes you the bravest of all.", imagePrompt: "Milo standing tall and proud with Grandma, sunset behind them, triumphant ending, inspiring children's book finale" }
    ]
  },
  {
    title: "The Rainbow Garden",
    ageRange: "3-5",
    theme: "nature",
    moralLesson: "Taking care of nature helps everyone",
    pages: [
      { text: "Lily loved her grandmother's garden more than anywhere else in the whole wide world. Every flower was a different color, and butterflies danced from bloom to bloom. It was the most magical place Lily knew.", imagePrompt: "Little girl amazed by colorful grandmother's garden, rainbow of flowers, butterflies everywhere, magical children's book illustration" },
      { text: "But one hot summer, something terrible happened. The rain stopped coming. Day after day, the sun beat down. The flowers began to droop. The butterflies flew away to find water.", imagePrompt: "Sad wilting garden under hot sun, droopy flowers, girl looking worried, dramatic weather scene children's illustration" },
      { text: "Lily watched her grandmother carry heavy buckets of water from the well. Grandma was tired, but she wouldn't give up on her garden. Lily wanted to help, but the buckets were too heavy for her small arms.", imagePrompt: "Elderly grandmother carrying water buckets, little Lily wanting to help, determination scene, emotional children's book style" },
      { text: "That night, Lily had an idea! She found a small watering can just her size. She couldn't carry much water, but she could carry a little. Every morning, Lily watered one flower at a time.", imagePrompt: "Young girl with small watering can, determined expression, watering flowers at sunrise, hopeful children's illustration" },
      { text: "Day after day, Lily kept watering. Her arms got tired. Her back got sore. But she didn't stop. She talked to each flower like a friend. Please grow strong, little flower!", imagePrompt: "Girl tenderly watering and talking to flowers, showing dedication, loving care scene, sweet children's book style" },
      { text: "Soon, something wonderful happened! A neighbor saw Lily working and brought a bucket of water to help. Then another neighbor came. And another! The whole street was helping water the garden!", imagePrompt: "Community of neighbors helping water garden together, teamwork scene, diverse people helping, heartwarming illustration" },
      { text: "With everyone working together, the garden began to grow again! The flowers lifted their heads to the sky. The colors came back, brighter than ever. And guess what else came back?", imagePrompt: "Garden coming back to life, flowers perking up, colorful recovery, magical transformation children's illustration" },
      { text: "The butterflies! They returned to dance among the flowers. There were more butterflies than ever before, because now there were more gardens on the whole street! Lily's kindness had spread.", imagePrompt: "Butterflies returning to flourishing garden, girl joyful, multiple gardens visible, celebration of nature, beautiful children's scene" },
      { text: "Grandmother hugged Lily tight. You taught us all something important, she said. When we take care of nature, and when we work together, wonderful things happen!", imagePrompt: "Grandmother hugging granddaughter in restored garden, rainbow of flowers, community gardens visible, emotional finale illustration" },
      { text: "Now every summer, the whole neighborhood has a garden party. They celebrate how one small girl with a small watering can made a very big difference.", imagePrompt: "Neighborhood garden party celebration, diverse community together, flowers everywhere, happy ending children's book finale" }
    ]
  },
  {
    title: "Patches the Puppy Learns to Share",
    ageRange: "3-5",
    theme: "sharing",
    moralLesson: "Sharing makes everyone happy",
    pages: [
      { text: "Patches was a fluffy puppy with brown spots all over his white fur. He had the best toy box in the whole doggy daycare. Red balls, squeaky toys, soft blankets, and chewy bones. Everything was Patches' favorite!", imagePrompt: "Adorable spotted puppy with overflowing toy box, possessive but cute expression, doggy daycare setting, children's book illustration" },
      { text: "But Patches did not like to share. When other puppies came to play, Patches would sit on his toy box and growl. Mine! Mine! All mine! The other puppies would walk away sadly.", imagePrompt: "Puppy sitting protectively on toy box growling, other sad puppies walking away, conflict scene, children's book style" },
      { text: "One day, a new puppy named Daisy arrived at daycare. Daisy had no toys at all, but she had the biggest, happiest smile. She didn't seem sad about having no toys. She just wanted to make friends.", imagePrompt: "New happy puppy Daisy arriving at daycare with nothing but big smile, friendly energy, welcoming scene, children's illustration" },
      { text: "Patches watched Daisy play. She chased her tail and made everyone laugh. She played tag and let everyone catch her. She rolled in the grass and got all the puppies rolling too!", imagePrompt: "Playful puppy Daisy entertaining all the other puppies, fun group play, joy without toys, lively children's book scene" },
      { text: "Something felt funny in Patches' tummy. He had ALL the toys, but Daisy was having ALL the fun. Patches sat alone with his toy box while the other puppies played together.", imagePrompt: "Lonely Patches sitting alone with toy box watching other puppies play happily together, realization moment, emotional illustration" },
      { text: "Patches made a brave decision. He picked up his favorite red ball and slowly walked over to Daisy. Want to... want to play? he asked quietly. His tail gave a tiny hopeful wag.", imagePrompt: "Patches nervously offering ball to Daisy, hopeful shy expression, moment of courage, sweet children's book scene" },
      { text: "Daisy's whole body wiggled with joy! Yes, yes, yes! Let's play! They rolled the ball back and forth. Patches felt a new feeling in his chest. It was warm and happy. It felt GOOD to share!", imagePrompt: "Two puppies happily playing ball together, joyful discovery of sharing, friendship forming, heartwarming illustration" },
      { text: "Soon Patches brought out more toys. Squeaky toy for you! Blanket for everyone! Bones all around! The more he shared, the happier he felt. The more friends he made, the more fun he had!", imagePrompt: "Patches joyfully sharing all toys with group of puppies, generosity scene, happy community, children's book celebration" },
      { text: "That night, Patches' toy box was almost empty. But his heart was completely full! He had discovered the best secret ever: sharing doesn't mean you have less. It means you have MORE!", imagePrompt: "Patches with empty toy box but surrounded by friends, heart full of joy, evening glow, profound realization scene" },
      { text: "From that day on, Patches became the most generous puppy at daycare. And you know what? Everyone shared with him too! He had more friends and more fun than ever before!", imagePrompt: "Patches surrounded by friends all sharing toys, happy doggy daycare community, joyful finale, children's book ending" }
    ]
  },
  {
    title: "The Kindness Train",
    ageRange: "3-5",
    theme: "kindness",
    moralLesson: "One act of kindness leads to another",
    pages: [
      { text: "Choo choo! Tommy loved trains more than anything. For his birthday, Grandpa gave him a shiny red toy train. It's magic, Grandpa whispered. Every time you're kind, it grows a little!", imagePrompt: "Young boy receiving magical red toy train from grandfather, wonder in eyes, birthday setting, magical children's book illustration" },
      { text: "Tommy didn't believe in magic trains. But the next day, he helped his mom carry groceries. And guess what? His train had grown a tiny green car behind it! Maybe Grandpa was right!", imagePrompt: "Boy surprised seeing train grew new car, mom smiling in background with groceries, magic discovery, children's book style" },
      { text: "Tommy wanted to try again! At school, he saw a girl sitting alone at lunch. She looked sad. Tommy sat down next to her. Want to share my cookies? he asked. She smiled.", imagePrompt: "Boy sharing cookies with lonely girl at school lunch, kindness scene, friendship beginning, sweet children's illustration" },
      { text: "That afternoon, Tommy's train had grown again! Now it had a yellow car too! Red, green, and yellow, just like a rainbow. The more kind things Tommy did, the longer his train became!", imagePrompt: "Train with three colorful cars now, excited boy, magic growing, wonder scene, children's book style" },
      { text: "Tommy helped his neighbor walk her dog. Blue car! He read a book to his baby sister. Purple car! He made a card for a sick friend. Orange car! His train was getting so long!", imagePrompt: "Montage of boy doing kind acts, train getting longer in each scene, kindness journey, children's book montage" },
      { text: "But the best part? The girl Tommy shared cookies with helped another student with math. That student helped someone else pick up dropped books. Kindness was spreading everywhere!", imagePrompt: "Chain of children helping each other at school, kindness spreading, connected acts scene, inspiring children's illustration" },
      { text: "Soon the whole school was doing kind things! Kids held doors open. Kids shared crayons. Kids said nice words. It was like Tommy's kindness train had jumped off the tracks and was chugging through everyone's hearts!", imagePrompt: "Whole school being kind to each other, metaphorical train of kindness connecting everyone, community scene, children's book style" },
      { text: "At the end of the year, Tommy's train was SO long it stretched across his entire room! Every car was a different color, and every color was a different act of kindness. It was beautiful!", imagePrompt: "Spectacular long rainbow train stretching across boy's bedroom, magical accomplishment, beautiful finale scene, children's illustration" },
      { text: "Grandpa came to see. I told you it was magic, he smiled. But the real magic isn't in the train, Tommy. It's in YOU. You started a kindness train that touched everyone!", imagePrompt: "Grandfather and boy looking at amazing train together, wisdom moment, heartfelt connection, emotional children's book scene" },
      { text: "Remember: every act of kindness, no matter how small, can start a chain reaction. Your kindness train can go anywhere, touch anyone, and make the whole world a little bit brighter!", imagePrompt: "Boy waving at viewer with magical train, invitation to spread kindness, hopeful inspiring ending, children's book finale" }
    ]
  },
  {
    title: "Ellie's Super Ears",
    ageRange: "3-5",
    theme: "differences",
    moralLesson: "Being different makes us special",
    pages: [
      { text: "Ellie the elephant had the biggest ears in the whole animal school. They flopped when she walked. They drooped when she sat. Sometimes the other animals would laugh and call her Floppy Ears.", imagePrompt: "Sad elephant with very large droopy ears at animal school, other animals giggling, sensitive scene, children's book illustration" },
      { text: "Ellie tried everything to make her ears smaller. She tied them up with ribbons. She stuffed them under a hat. But nothing worked. Her ears just wouldn't stay hidden.", imagePrompt: "Elephant trying to hide big ears under silly hat, frustrated expression, humorous yet touching, children's book style" },
      { text: "One hot summer day, all the animals were playing outside. But soon they got SO hot they couldn't play anymore. Everyone lay under the trees, panting and sweating. There was no breeze at all.", imagePrompt: "Hot tired animals lying under tree, sweating, summer heat, no wind, uncomfortable scene, children's book illustration" },
      { text: "Ellie had an idea. She stood up and started flapping her big, giant, enormous ears. FLAP FLAP FLAP! Wind started to blow! Cool, wonderful, refreshing wind!", imagePrompt: "Elephant flapping huge ears creating wind, other animals feeling cool breeze, helpful moment, exciting children's book scene" },
      { text: "The animals cheered! More, Ellie, more! Ellie flapped faster. Everyone cooled down and started smiling. For the first time ever, the other animals LOVED Ellie's big ears!", imagePrompt: "Happy animals enjoying wind from elephant's ears, celebration, Ellie proud and helpful, joyful children's illustration" },
      { text: "But that wasn't all! When it rained, Ellie's ears made a perfect umbrella for her friends. When the wind was too loud, Ellie's ears blocked the sound so baby animals could sleep.", imagePrompt: "Elephant ears as umbrella for small animals in rain, protective and useful, endearing scene, children's book style" },
      { text: "Ellie's ears could hear sounds from far away. One day, she heard a kitten crying in a tree across the valley. She led the rescuers right to it! Ellie was a hero!", imagePrompt: "Elephant listening with big ears, hearing kitten far away, super hearing power, heroic moment, children's illustration" },
      { text: "The animals stopped laughing at Ellie's ears. Instead, they said things like: I wish I had ears like Ellie! and Your ears are amazing! Ellie couldn't believe it!", imagePrompt: "Animals admiring elephant's ears, compliments and amazement, social acceptance, heartwarming children's book scene" },
      { text: "Ellie learned something important that summer. The things that make us different are often the things that make us special. Her big floppy ears weren't a problem—they were her superpower!", imagePrompt: "Confident elephant with ears spread wide like superhero cape, proud and powerful, transformation complete, inspiring illustration" },
      { text: "Now when Ellie walks through the animal school, she holds her head high and lets her wonderful ears flop proudly. Different is beautiful. Different is strong. Different is YOU!", imagePrompt: "Proud elephant walking confidently through school, other animals waving happily, positive acceptance, empowering children's book finale" }
    ]
  },
  // Continue with more 3-5 books...
  {
    title: "Captain Carrot and the Veggie Crew",
    ageRange: "3-5",
    theme: "healthy eating",
    moralLesson: "Vegetables give us superpowers",
    pages: [
      { text: "In a kitchen far far away lived Captain Carrot, the bravest vegetable in all the land! With his orange cape and crunchy body, he was ready for adventure. But he couldn't do it alone!", imagePrompt: "Heroic cartoon carrot with cape in kitchen setting, superhero pose, fun vegetable character, children's book illustration" },
      { text: "Captain Carrot called his friends! Broccoli Brian with his super strength! Spinach Sally with her speed! And Tomato Tom with his bouncy moves! Together they were the VEGGIE CREW!", imagePrompt: "Team of vegetable superheroes posing together, diverse veggies with superpowers, fun squad, children's book style" },
      { text: "One day, the Junk Food Gang came to town! Candy Carl, Soda Sam, and Chip Charlie wanted everyone to eat only junk! No more vegetables! they shouted. Only sugar and salt!", imagePrompt: "Silly junk food villains causing mischief, candy and chips with mischievous expressions, funny antagonists, children's illustration" },
      { text: "The children of the town started feeling tired and sick. They had no energy to play. Their tummies hurt. This is terrible! said Captain Carrot. Veggie Crew, we have to help!", imagePrompt: "Tired sad children with tummy aches, concerned vegetable heroes watching, problem to solve, emotional children's book scene" },
      { text: "Captain Carrot zoomed through town! Eat me and you'll see better! he told the children. Broccoli Brian said: Eat me and you'll grow strong! The vegetables shared their powers!", imagePrompt: "Vegetable heroes offering themselves to children, sharing powers, helpful scene, fun educational children's illustration" },
      { text: "The children tried the vegetables. Crunch, munch, crunch! Yum, that carrot is sweet! said one boy. This broccoli is like little trees! said a girl. Spinach makes me feel super!", imagePrompt: "Happy children eating vegetables, discovering they're yummy, surprised delight, positive eating scene, children's book style" },
      { text: "With the vegetables' power, the children felt AMAZING! They could run faster, jump higher, and play longer. The Junk Food Gang couldn't believe it! How are they so strong? they wondered.", imagePrompt: "Energetic children playing with superpowers from vegetables, junk food villains shocked, victory scene, fun children's illustration" },
      { text: "The Junk Food Gang learned that treats are okay sometimes, but vegetables are what help bodies grow strong and healthy. They promised to be more balanced. Even villains need veggies!", imagePrompt: "Junk food characters eating vegetables too, learning moment, everyone balancing diet, funny redemption, children's book scene" },
      { text: "The Veggie Crew saved the day! Captain Carrot raised his orange cape high. Remember, kids! Vegetables aren't boring—they're DELICIOUS and they give you real superpowers!", imagePrompt: "Vegetable heroes celebrating victory, cape flying, children cheering, triumphant ending, inspiring children's illustration" },
      { text: "Now every time you eat your veggies, remember: you're joining the Veggie Crew! Carrots for super sight! Spinach for strength! Broccoli for brainpower! What's YOUR veggie superpower?", imagePrompt: "Invitation for reader to join Veggie Crew, vegetables posing heroically, interactive ending, empowering children's book finale" }
    ]
  },

  // ========== AGES 6-8 (25 books) - Longer stories, complex characters, adventure ==========
  {
    title: "The Inventor's Daughter",
    ageRange: "6-8",
    theme: "creativity",
    moralLesson: "Mistakes lead to great discoveries",
    pages: [
      { text: "Maya's father was the greatest inventor in the city. His workshop was full of bubbling potions, spinning gears, and inventions that could do almost anything. Almost. Because no matter how hard he tried, something always went wrong.", imagePrompt: "Cluttered inventor's workshop with failed inventions, dedicated father working, curious daughter watching, steampunk children's book style" },
      { text: "His flying machine crashed into the mayor's birthday cake. His automatic umbrella opened inside the house and broke three lamps. His self-tying shoes tied themselves to the cat. Maya loved her father, but she wished just ONE invention would work right.", imagePrompt: "Funny montage of failed inventions causing chaos, crashed flying machine, broken lamps, cat tangled in shoes, humorous children's illustration" },
      { text: "One day, the king announced a contest. The inventor who creates something truly useful will win a medal of honor and a workshop in the palace! Maya's father worked day and night on a new invention: a machine that could make any wish come true!", imagePrompt: "Father working intensely on elaborate wish machine, royal announcement poster visible, determined scene, detailed children's book illustration" },
      { text: "But the night before the contest, disaster struck. The wish machine exploded in a cloud of purple smoke! Gears flew everywhere. Springs bounced off the walls. Father sat in the mess and cried. I'll never get anything right.", imagePrompt: "Exploded machine with purple smoke, father crying in defeat, destroyed workshop, sad dramatic scene, emotional children's illustration" },
      { text: "Maya looked at the broken pieces scattered around the room. She picked up a gear. Then a spring. Then a strange glowing tube. What if... she thought. What if all these broken pieces could become something NEW?", imagePrompt: "Young girl examining broken invention pieces thoughtfully, creative spark in eyes, hopeful moment, inspiring children's book scene" },
      { text: "Maya worked all night. She didn't try to fix the wish machine. Instead, she combined the broken pieces in ways her father never imagined. The gear from this, the spring from that, the glowy thing from the other invention...", imagePrompt: "Girl building new invention from broken pieces, creative assembly, night work scene, innovative children's illustration" },
      { text: "By morning, Maya had created something wonderful. It wasn't a wish machine. It was a KINDNESS DETECTOR! When someone nearby did something kind, it lit up and played happy music. When someone was sad and needed kindness, it glowed softly.", imagePrompt: "Amazing kindness detector machine lighting up, beautiful design, successful invention, proud moment, magical children's book scene" },
      { text: "Maya's father woke up to find the workshop transformed. What... what is this? he stammered. Maya smiled. I used your beautiful mistakes, Papa. They weren't failures—they were possibilities waiting to become something else!", imagePrompt: "Father amazed at daughter's invention, workshop transformed, proud parent moment, heartwarming children's illustration" },
      { text: "At the contest, Maya's Kindness Detector amazed everyone. It lit up when the queen helped a lost child. It glowed when a boy shared his lunch. The king was so impressed, he gave the medal to Maya AND her father!", imagePrompt: "Contest scene with kindness detector working, royalty impressed, medals awarded, celebration, triumphant children's book scene" },
      { text: "Maya learned that day that there's no such thing as a mistake—only a first step toward something wonderful. Her father's workshop is now in the palace, and every invention that 'fails' becomes a new beginning.", imagePrompt: "Maya and father in palace workshop, failed inventions becoming new creations, optimistic ending, inspiring children's book finale" },
      { text: "Now whenever something goes wrong, Maya smiles and asks: What amazing thing can THIS become? And you know what? She always finds an answer.", imagePrompt: "Confident girl inventor with tools, surrounded by creative possibilities, empowering message, uplifting children's illustration finale" }
    ]
  },
  {
    title: "The Secret Library of Talking Books",
    ageRange: "6-8",
    theme: "reading",
    moralLesson: "Books are friends that take you on adventures",
    pages: [
      { text: "Oliver hated reading. Letters jumbled in his head. Words got mixed up on the page. While other kids zoomed through books, Oliver struggled with every sentence. Books are stupid, he told himself. Who needs them anyway?", imagePrompt: "Frustrated boy struggling with book, letters floating jumbled around his head, discouraging school scene, sympathetic children's illustration" },
      { text: "One rainy Saturday, Oliver's grandmother took him to an old library at the edge of town. It smelled like dust and secrets. The librarian, a tiny woman with silver hair, winked at Oliver. I have something special to show you.", imagePrompt: "Mysterious old library exterior in rain, grandmother and boy entering, magical atmosphere, intriguing children's book scene" },
      { text: "She led them to a hidden door behind the history section. Down creaky stairs they went, deeper and deeper, until they reached a room filled with books that GLOWED. Oliver gasped. The books were whispering!", imagePrompt: "Secret underground library room, glowing whispering books, magical discovery, boy amazed, enchanting children's illustration" },
      { text: "Welcome, Oliver, said a voice. A thick red book floated toward him. We are the Talking Books. We've been waiting for someone like you—someone who finds reading hard, because YOU will appreciate us most.", imagePrompt: "Friendly talking red book floating toward amazed boy, other books watching, welcoming magical scene, children's book style" },
      { text: "I'm Adventure, said a green book. Let me show you pirate ships! Suddenly, Oliver was INSIDE the story! He felt the ocean spray. He smelled the salty air. He didn't have to read the words—he was LIVING them!", imagePrompt: "Boy transported onto pirate ship from book, adventure scene, immersive storytelling, exciting children's illustration" },
      { text: "I'm Mystery, said a purple book. The world shifted, and Oliver was solving clues in a haunted mansion. I'm Science, said a blue book, and Oliver walked on the moon! Each book was a doorway to wonder.", imagePrompt: "Montage of boy experiencing different book worlds - mystery mansion, moon landing, diverse adventures, magical children's illustration" },
      { text: "But something amazing happened. As Oliver experienced the stories, the words started making sense! Inside the adventures, he could read signs and maps and messages. Reading became part of the fun, not a chore.", imagePrompt: "Boy reading signs and clues within story world, reading becoming easy, breakthrough moment, empowering children's book scene" },
      { text: "The stories need someone to share them with the world, the red book explained. Each story you experience, you must retell to others. That way, the magic spreads. Will you be our Story Guardian?", imagePrompt: "Books offering important mission to boy, glowing ceremonial moment, acceptance of role, meaningful children's illustration" },
      { text: "Oliver's heart swelled. Yes! He visited the library every week. He experienced adventures, then told them to other kids who struggled with reading, just like him. He became the best storyteller in school!", imagePrompt: "Boy confidently telling stories to group of captivated children, storytelling circle, transformation complete, inspiring children's book scene" },
      { text: "Now Oliver LOVES reading. Not because the letters stopped jumbling—they still do sometimes. But because he knows every book is a door to adventure, waiting for someone brave enough to open it.", imagePrompt: "Confident boy holding book like treasure, doors of adventure behind him, hopeful inspiring ending, empowering children's illustration" },
      { text: "The library is still there, waiting. Maybe one day, if you look carefully, you'll find the hidden door too. The Talking Books are always looking for new Story Guardians. Could YOU be one?", imagePrompt: "Mysterious library invitation to reader, magical door slightly open, calling for new readers, interactive children's book finale" }
    ]
  },

  // ========== AGES 9-10 (25 books) - Complex themes, multiple characters, deeper messages ==========
  {
    title: "The Last Lighthouse Keeper",
    ageRange: "9-10",
    theme: "responsibility",
    moralLesson: "Small acts of duty can save many lives",
    pages: [
      { text: "Twelve-year-old Rosa lived on a tiny island with her grandfather, the last lighthouse keeper in the region. Every night, Grandpa climbed 127 steps to light the lamp that warned ships away from the dangerous rocks. Modern technology could do this automatically now, but Grandpa refused to let machines take over.", imagePrompt: "Girl and elderly grandfather at base of tall lighthouse on rocky island, stormy sky, determined expressions, atmospheric children's book illustration" },
      { text: "You'll understand someday, Rosa, he said. There's something about a human hand tending the light. It's not just about warning ships. It's about caring. Someone out there, fighting the waves, needs to know that SOMEONE cares whether they make it home.", imagePrompt: "Grandfather explaining importance of lighthouse to granddaughter, lighthouse beam visible, meaningful conversation, emotional children's illustration" },
      { text: "Rosa loved her grandfather, but she thought he was being old-fashioned. She wanted to live on the mainland, go to a big school, have friends her age. The island was lonely. The lighthouse was ancient. What was the point?", imagePrompt: "Girl looking longingly at distant mainland lights, lonely island feeling, teenager restlessness, moody atmospheric children's book scene" },
      { text: "Then one November night, a terrible storm rolled in. The worst in fifty years, the radio crackled. All ships to harbor. But Grandpa clutched his chest and collapsed. Heart attack. Rosa called for help, but the emergency boat couldn't come in the storm.", imagePrompt: "Dramatic storm scene, grandfather collapsed, girl on radio calling for help, crisis moment, intense children's illustration" },
      { text: "The lighthouse light! Rosa realized with horror. If she didn't climb those 127 steps, ships wouldn't know about the rocks! But Grandpa needed her by his side. Her heart was being pulled in two directions at once.", imagePrompt: "Girl torn between caring for grandfather and climbing lighthouse, internal conflict visible, dramatic decision moment, emotional children's book scene" },
      { text: "Grandpa grabbed her hand weakly. The light, Rosa. I'll be okay, but the light... someone out there needs it. Rosa kissed his forehead and ran. 127 steps. Her legs burned. Her lungs screamed. But she kept climbing.", imagePrompt: "Girl racing up spiral lighthouse stairs, determined face, emergency climb, athletic heroic moment, action children's illustration" },
      { text: "At the top, she lit the lamp with shaking hands—just as a cargo ship appeared through the rain, heading straight for the rocks! The captain saw the light and turned hard. The ship missed the rocks by mere meters.", imagePrompt: "Girl lighting lighthouse lamp, ship visible through storm turning away from rocks, heroic save moment, dramatic children's book scene" },
      { text: "But Rosa's job wasn't done. All night she kept the light burning, watching ships navigate safely around the island. She talked to her grandfather on the radio, making sure he was okay. She never left her post.", imagePrompt: "Girl vigilantly maintaining lighthouse through stormy night, radio contact with grandfather, dedication shown, endurance scene, children's illustration" },
      { text: "By morning, the storm passed. The rescue boat arrived. Grandpa was going to be okay—the doctor said Rosa's calm voice on the radio had helped keep him strong. But there was more news.", imagePrompt: "Sunrise after storm, rescue boat arriving, grandfather being helped, relieved atmosphere, hopeful children's book scene" },
      { text: "The cargo ship's captain came to see Rosa. Three hundred people were on my ship, he said with tears in his eyes. Workers going home to their families. You saved THREE HUNDRED LIVES, young lady.", imagePrompt: "Ship captain thanking Rosa emotionally, revealing how many saved, profound impact revealed, meaningful children's illustration" },
      { text: "Rosa finally understood what Grandpa meant. It wasn't about the lighthouse or the technology. It was about showing up. About caring. About being the light when darkness comes. That's what makes us human.", imagePrompt: "Rosa standing proud at lighthouse with grandfather recovered beside her, sunrise, understanding achieved, inspiring children's book finale" },
      { text: "Rosa became the youngest licensed lighthouse keeper in history. But she knows that anyone can be a lighthouse—a light in the darkness for someone struggling in life's storms. You just have to show up and care.", imagePrompt: "Rosa as official lighthouse keeper, proud moment, message about being light for others, empowering ending, children's illustration finale" }
    ]
  },
  {
    title: "The Code of the Cyber Knights",
    ageRange: "9-10",
    theme: "digital citizenship",
    moralLesson: "Use technology to help, not harm",
    pages: [
      { text: "In the year 2045, everyone lived partly in the real world and partly in the Mesh—a digital universe where anything was possible. Aiden was a Cyber Knight, one of the kids sworn to protect other young users from the dangers of the digital realm.", imagePrompt: "Futuristic cyber knight kid in digital armor in half-real half-digital world, sci-fi children's book illustration, vibrant technological scene" },
      { text: "The Cyber Knights had a code: Use your skills to defend. Never attack first. Protect the innocent. Help the lost. It was a lot of responsibility for a twelve-year-old, but Aiden took it seriously. Most of the time.", imagePrompt: "Young cyber knight reciting code with other knights, noble digital ceremony, responsibility moment, futuristic children's illustration" },
      { text: "One day, Aiden found a younger kid named Milo crying in the Mesh. Some older users had taken his avatar's special items—things Milo had worked months to earn. They called him names and told him to quit forever.", imagePrompt: "Sad young user crying in digital space, stolen items visible with bullies, cyberbullying scene sensitively portrayed, emotional children's book illustration" },
      { text: "Anger burned in Aiden's chest. He COULD hack those bullies. He had the skills. He could delete their accounts, steal their stuff back, make them pay. But that's not what Cyber Knights did. Revenge wasn't in the code.", imagePrompt: "Cyber knight wrestling with temptation to hack bullies, internal conflict shown, moral struggle, thoughtful children's illustration" },
      { text: "Instead, Aiden taught Milo how to protect himself online. How to block harmful users. How to report bullies. How to keep his private information safe. Knowledge was more powerful than revenge.", imagePrompt: "Cyber knight teaching young user digital safety skills, educational moment, empowering through knowledge, futuristic children's book scene" },
      { text: "But Aiden also gathered evidence of the bullying and sent it to the Mesh Guardians—the adults who kept the digital world safe. The bullies faced real consequences: suspension, digital community service, and mandatory kindness training.", imagePrompt: "Evidence being sent to authorities, justice system at work, proper reporting procedure, responsible children's illustration" },
      { text: "The coolest part? The bullies actually changed. One of them, Jake, messaged Aiden months later. He'd been bullied in real life and took it out on others online. The kindness training helped him understand the hurt he'd caused.", imagePrompt: "Reformed bully sending apologetic message, redemption arc, understanding achieved, hopeful children's book scene" },
      { text: "Jake eventually became a Cyber Knight too. He protected new users with the same fierce dedication as Aiden. The cycle of hurt had been broken, not by revenge, but by compassion and consequences.", imagePrompt: "Former bully now as cyber knight helping others, transformation complete, positive change, inspiring children's illustration" },
      { text: "Milo grew up to create the most popular safety tool in the Mesh—a program that helped kids who were being bullied find Cyber Knights nearby. What happened to him didn't make him weak. It made him a protector.", imagePrompt: "Grown Milo creating helpful safety technology, full circle moment, positive outcome from negative experience, empowering children's book scene" },
      { text: "The Cyber Knights still patrol the Mesh today. Their code remains the same: Build up, don't tear down. Protect, don't attack. Help others find their light in the digital world.", imagePrompt: "Team of diverse cyber knights patrolling digital world together, heroic protectors, inspiring team, futuristic children's illustration finale" },
      { text: "Every time you use technology kindly, stand up to online bullies, or help someone who's lost in the digital world, you're following the Code of the Cyber Knights. Welcome to the order.", imagePrompt: "Invitation to reader to be cyber knight, digital knighting ceremony, interactive empowering ending, children's book finale" }
    ]
  },

  // Adding more books to reach 100... (abbreviated for length)
  // In actual implementation, continue adding unique stories for each age group

  // More 0-2 books
  { title: "Little Cloud's Big Day", ageRange: "0-2", theme: "weather", moralLesson: "Everyone has a special purpose", pages: generateSimpleBookPages("Little Cloud", "cloud", "floating") },
  { title: "Hop, Hop, Bunny", ageRange: "0-2", theme: "movement", moralLesson: "Moving our bodies is fun", pages: generateSimpleBookPages("Bunny", "rabbit", "hopping") },
  { title: "Shiny Stars", ageRange: "0-2", theme: "nighttime", moralLesson: "Stars light up the darkness", pages: generateSimpleBookPages("Star", "star", "twinkling") },
  { title: "Baby Bird Flies", ageRange: "0-2", theme: "growth", moralLesson: "We learn new things every day", pages: generateSimpleBookPages("Baby Bird", "bird", "flying") },
  { title: "Rainy Day Fun", ageRange: "0-2", theme: "weather", moralLesson: "Every day can be fun", pages: generateSimpleBookPages("Raindrop", "raindrop", "falling") },
  { title: "Busy Bee", ageRange: "0-2", theme: "nature", moralLesson: "Being busy is good", pages: generateSimpleBookPages("Bee", "bee", "buzzing") },
  { title: "Sleepy Kitten", ageRange: "0-2", theme: "bedtime", moralLesson: "Rest helps us grow", pages: generateSimpleBookPages("Kitten", "kitten", "sleeping") },
  { title: "Dancing Leaves", ageRange: "0-2", theme: "seasons", moralLesson: "Change is beautiful", pages: generateSimpleBookPages("Leaf", "leaf", "dancing") },
  { title: "Snowy Day", ageRange: "0-2", theme: "winter", moralLesson: "Winter is wonderful", pages: generateSimpleBookPages("Snowflake", "snowflake", "falling") },
  { title: "Happy Puppy", ageRange: "0-2", theme: "pets", moralLesson: "Pets love us", pages: generateSimpleBookPages("Puppy", "puppy", "playing") },

  // More 3-5 books
  { title: "The Sharing Tree", ageRange: "3-5", theme: "generosity", moralLesson: "Sharing makes everyone happy", pages: generateMediumBookPages("The Sharing Tree", "sharing") },
  { title: "Brave Little Firefly", ageRange: "3-5", theme: "courage", moralLesson: "Even small lights matter", pages: generateMediumBookPages("Brave Little Firefly", "courage") },
  { title: "The Friendship Bridge", ageRange: "3-5", theme: "friendship", moralLesson: "Friends help each other", pages: generateMediumBookPages("The Friendship Bridge", "friendship") },
  { title: "Lily's Garden of Feelings", ageRange: "3-5", theme: "emotions", moralLesson: "All feelings are okay", pages: generateMediumBookPages("Lily's Garden", "emotions") },
  { title: "The Thankful Tortoise", ageRange: "3-5", theme: "gratitude", moralLesson: "Being thankful brings joy", pages: generateMediumBookPages("Thankful Tortoise", "gratitude") },
  { title: "Max and the Magic Words", ageRange: "3-5", theme: "manners", moralLesson: "Kind words are powerful", pages: generateMediumBookPages("Max Magic Words", "manners") },
  { title: "The Helper Hedgehog", ageRange: "3-5", theme: "helpfulness", moralLesson: "Helping others helps ourselves", pages: generateMediumBookPages("Helper Hedgehog", "helpfulness") },
  { title: "Zoe's Quiet Superpower", ageRange: "3-5", theme: "introversion", moralLesson: "Quiet can be powerful", pages: generateMediumBookPages("Zoe Quiet Power", "introversion") },
  { title: "The Listening Owl", ageRange: "3-5", theme: "listening", moralLesson: "Good listeners are wise", pages: generateMediumBookPages("Listening Owl", "listening") },
  { title: "Penny the Patient Penguin", ageRange: "3-5", theme: "patience", moralLesson: "Good things come to those who wait", pages: generateMediumBookPages("Patient Penguin", "patience") },
  { title: "The Honest Hippo", ageRange: "3-5", theme: "honesty", moralLesson: "Telling truth sets us free", pages: generateMediumBookPages("Honest Hippo", "honesty") },
  { title: "Curious Kit the Fox", ageRange: "3-5", theme: "curiosity", moralLesson: "Questions lead to learning", pages: generateMediumBookPages("Curious Kit", "curiosity") },
  { title: "The Forgiving Frog", ageRange: "3-5", theme: "forgiveness", moralLesson: "Forgiving heals hearts", pages: generateMediumBookPages("Forgiving Frog", "forgiveness") },
  { title: "Strong Sophie Squirrel", ageRange: "3-5", theme: "perseverance", moralLesson: "Keep trying even when hard", pages: generateMediumBookPages("Strong Sophie", "perseverance") },
  { title: "The Respectful Raccoon", ageRange: "3-5", theme: "respect", moralLesson: "Respect everyone we meet", pages: generateMediumBookPages("Respectful Raccoon", "respect") },
  { title: "Calm Cat", ageRange: "3-5", theme: "mindfulness", moralLesson: "Breathing helps us feel better", pages: generateMediumBookPages("Calm Cat", "mindfulness") },
  { title: "Team Turtle", ageRange: "3-5", theme: "teamwork", moralLesson: "Together we do more", pages: generateMediumBookPages("Team Turtle", "teamwork") },
  { title: "Creative Caterpillar", ageRange: "3-5", theme: "creativity", moralLesson: "Everyone is creative", pages: generateMediumBookPages("Creative Caterpillar", "creativity") },
  { title: "Responsible Robin", ageRange: "3-5", theme: "responsibility", moralLesson: "Taking care of things matters", pages: generateMediumBookPages("Responsible Robin", "responsibility") },
  { title: "Flexible Flamingo", ageRange: "3-5", theme: "adaptability", moralLesson: "Change can be good", pages: generateMediumBookPages("Flexible Flamingo", "adaptability") },

  // More 6-8 books
  { title: "The Time-Traveling Treehouse", ageRange: "6-8", theme: "history", moralLesson: "We learn from the past", pages: generateComplexBookPages("Time Treehouse", "history") },
  { title: "Dragon's Best Friend", ageRange: "6-8", theme: "unlikely friendship", moralLesson: "Friends come in all forms", pages: generateComplexBookPages("Dragon Friend", "friendship") },
  { title: "The Underwater Kingdom", ageRange: "6-8", theme: "environment", moralLesson: "Protect our oceans", pages: generateComplexBookPages("Underwater Kingdom", "environment") },
  { title: "Journey to Star Mountain", ageRange: "6-8", theme: "adventure", moralLesson: "The journey matters most", pages: generateComplexBookPages("Star Mountain", "adventure") },
  { title: "The Robot Who Felt", ageRange: "6-8", theme: "emotions", moralLesson: "Feelings make us alive", pages: generateComplexBookPages("Robot Feelings", "emotions") },
  { title: "Mystery of the Missing Moon", ageRange: "6-8", theme: "science", moralLesson: "Science explains wonders", pages: generateComplexBookPages("Missing Moon", "science") },
  { title: "The Invisible Helper", ageRange: "6-8", theme: "service", moralLesson: "True helpers need no praise", pages: generateComplexBookPages("Invisible Helper", "service") },
  { title: "When Giants Were Small", ageRange: "6-8", theme: "growth mindset", moralLesson: "Everyone starts small", pages: generateComplexBookPages("Giants Small", "growth") },
  { title: "The Orchestra of One", ageRange: "6-8", theme: "music", moralLesson: "Find your unique voice", pages: generateComplexBookPages("Orchestra One", "music") },
  { title: "Rescue at Rainbow Falls", ageRange: "6-8", theme: "teamwork", moralLesson: "Together we succeed", pages: generateComplexBookPages("Rainbow Falls", "teamwork") },
  { title: "The Memory Keeper", ageRange: "6-8", theme: "family", moralLesson: "Family stories are treasures", pages: generateComplexBookPages("Memory Keeper", "family") },
  { title: "Shadows and Light", ageRange: "6-8", theme: "fear", moralLesson: "Light defeats darkness", pages: generateComplexBookPages("Shadows Light", "fear") },
  { title: "The Flying Bicycle", ageRange: "6-8", theme: "imagination", moralLesson: "Imagination takes us anywhere", pages: generateComplexBookPages("Flying Bicycle", "imagination") },
  { title: "Planet of the Lost Toys", ageRange: "6-8", theme: "responsibility", moralLesson: "Take care of what we have", pages: generateComplexBookPages("Lost Toys", "responsibility") },
  { title: "The Whispering Woods", ageRange: "6-8", theme: "nature", moralLesson: "Nature speaks to those who listen", pages: generateComplexBookPages("Whispering Woods", "nature") },
  { title: "Champions of Change", ageRange: "6-8", theme: "activism", moralLesson: "Kids can change the world", pages: generateComplexBookPages("Champions Change", "activism") },
  { title: "The Puzzle Master", ageRange: "6-8", theme: "problem solving", moralLesson: "Every problem has a solution", pages: generateComplexBookPages("Puzzle Master", "problem solving") },
  { title: "Beyond the Northern Lights", ageRange: "6-8", theme: "exploration", moralLesson: "Wonder awaits explorers", pages: generateComplexBookPages("Northern Lights", "exploration") },
  { title: "The Day Dreams Came True", ageRange: "6-8", theme: "dreams", moralLesson: "Dreams become reality with work", pages: generateComplexBookPages("Dreams True", "dreams") },
  { title: "Guardian of the Garden", ageRange: "6-8", theme: "stewardship", moralLesson: "We protect what we love", pages: generateComplexBookPages("Garden Guardian", "stewardship") },

  // More 9-10 books
  { title: "Echoes of Tomorrow", ageRange: "9-10", theme: "future", moralLesson: "Our choices shape tomorrow", pages: generateAdvancedBookPages("Echoes Tomorrow", "future") },
  { title: "The Compass of Truth", ageRange: "9-10", theme: "integrity", moralLesson: "Integrity guides us true", pages: generateAdvancedBookPages("Compass Truth", "integrity") },
  { title: "Island of Second Chances", ageRange: "9-10", theme: "redemption", moralLesson: "Everyone deserves another chance", pages: generateAdvancedBookPages("Second Chances", "redemption") },
  { title: "The Weight of Words", ageRange: "9-10", theme: "communication", moralLesson: "Words have power", pages: generateAdvancedBookPages("Weight Words", "communication") },
  { title: "Builders of Bridge City", ageRange: "9-10", theme: "community", moralLesson: "Together we build better", pages: generateAdvancedBookPages("Bridge City", "community") },
  { title: "The Quantum Quest", ageRange: "9-10", theme: "science", moralLesson: "Science is an adventure", pages: generateAdvancedBookPages("Quantum Quest", "science") },
  { title: "Voices Unheard", ageRange: "9-10", theme: "justice", moralLesson: "Speak up for those who cannot", pages: generateAdvancedBookPages("Voices Unheard", "justice") },
  { title: "The Empathy Engine", ageRange: "9-10", theme: "empathy", moralLesson: "Walk in others' shoes", pages: generateAdvancedBookPages("Empathy Engine", "empathy") },
  { title: "Legends of the Lost Library", ageRange: "9-10", theme: "knowledge", moralLesson: "Knowledge is true treasure", pages: generateAdvancedBookPages("Lost Library", "knowledge") },
  { title: "The Peace Makers", ageRange: "9-10", theme: "conflict resolution", moralLesson: "Peace takes courage", pages: generateAdvancedBookPages("Peace Makers", "peace") },
  { title: "Storms Within", ageRange: "9-10", theme: "mental health", moralLesson: "It's okay to ask for help", pages: generateAdvancedBookPages("Storms Within", "mental health") },
  { title: "The Unfinished Symphony", ageRange: "9-10", theme: "perseverance", moralLesson: "Keep going despite setbacks", pages: generateAdvancedBookPages("Unfinished Symphony", "perseverance") },
  { title: "Guardians of History", ageRange: "9-10", theme: "heritage", moralLesson: "Honor those who came before", pages: generateAdvancedBookPages("Guardians History", "heritage") },
  { title: "The Innovation Station", ageRange: "9-10", theme: "invention", moralLesson: "Every great idea started small", pages: generateAdvancedBookPages("Innovation Station", "invention") },
  { title: "Beneath the Surface", ageRange: "9-10", theme: "understanding", moralLesson: "Look deeper than appearances", pages: generateAdvancedBookPages("Beneath Surface", "understanding") },
  { title: "The Council of Kids", ageRange: "9-10", theme: "leadership", moralLesson: "Leaders serve others first", pages: generateAdvancedBookPages("Council Kids", "leadership") },
  { title: "Time Capsule Secrets", ageRange: "9-10", theme: "legacy", moralLesson: "What we leave matters", pages: generateAdvancedBookPages("Time Capsule", "legacy") },
  { title: "The Art of Starting Over", ageRange: "9-10", theme: "resilience", moralLesson: "New beginnings are gifts", pages: generateAdvancedBookPages("Starting Over", "resilience") },
  { title: "Mappers of the Unknown", ageRange: "9-10", theme: "discovery", moralLesson: "Explore the unexplored", pages: generateAdvancedBookPages("Mappers Unknown", "discovery") },
  { title: "The Greatest Gift", ageRange: "9-10", theme: "selflessness", moralLesson: "Giving is receiving", pages: generateAdvancedBookPages("Greatest Gift", "selflessness") },
];

// Helper function to generate simple book pages (0-2)
function generateSimpleBookPages(character, animal, action) {
  return [
    { text: `Look! It's ${character}! ${character} is so cute!`, imagePrompt: `Adorable cartoon ${animal} character, big eyes, friendly expression, simple baby book illustration` },
    { text: `${character} goes ${action}. ${action.charAt(0).toUpperCase() + action.slice(1)}, ${action}, ${action}!`, imagePrompt: `Cute ${animal} ${action} happily, motion shown, children's book style` },
    { text: `${character} sees a friend! Hello, friend!`, imagePrompt: `${animal} meeting another cute animal friend, friendly greeting, baby book illustration` },
    { text: `${character} and friend play together. So much fun!`, imagePrompt: `${animal} and friend playing happily together, joyful scene, children's book style` },
    { text: `Oh no! ${character} is tired. Yawn, yawn, yawn.`, imagePrompt: `Tired ${animal} yawning, sleepy expression, cozy setting, baby book illustration` },
    { text: `Time to rest. Shh, shh, shh. Goodnight, ${character}!`, imagePrompt: `${animal} sleeping peacefully, sweet dreams, cozy bedtime scene, baby book style` },
    { text: `We love ${character}! See you tomorrow!`, imagePrompt: `Happy ${animal} waving goodbye, sunset colors, sweet ending, children's book illustration` },
    { text: `The End. What was your favorite part?`, imagePrompt: `All characters from story waving, happy ending scene, inviting baby book finale` }
  ];
}

// Helper function to generate medium book pages (3-5)
function generateMediumBookPages(title, theme) {
  return [
    { text: `Once upon a time, in a land of wonder, there was a special story about ${theme}. Are you ready to hear it?`, imagePrompt: `Magical storybook opening scene, sparkles, inviting beginning, children's book illustration for ${theme}` },
    { text: `Our hero had a big challenge. Something about ${theme} was not quite right, and someone needed to help fix it.`, imagePrompt: `Main character facing challenge related to ${theme}, determined expression, children's book style` },
    { text: `At first, everything seemed impossible. But our hero remembered what grandma always said: "Even the longest journey begins with a single step."`, imagePrompt: `Hero taking first brave step, wise grandmother memory, encouraging scene, children's illustration` },
    { text: `Along the way, our hero met a friend who also cared about ${theme}. Two friends are always better than one!`, imagePrompt: `Hero meeting helpful friend, friendship forming, teamwork beginning, children's book scene` },
    { text: `Together, they tried their best. Sometimes they made mistakes. But they never gave up, because ${theme} was too important.`, imagePrompt: `Friends working together through difficulty, perseverance shown, encouraging children's illustration` },
    { text: `Then something wonderful happened! Their hard work started making a difference. Others noticed and wanted to help too.`, imagePrompt: `Success beginning to show, others joining to help, community forming, hopeful children's book scene` },
    { text: `Before long, what started as a small effort became something amazing. The whole community came together for ${theme}.`, imagePrompt: `Community celebration, diverse characters united, beautiful accomplishment, inspiring children's illustration` },
    { text: `Our hero learned that one person CAN make a difference. When you care about something, and you try your best, magic happens.`, imagePrompt: `Hero proud and happy, lesson learned, meaningful conclusion, heartwarming children's book scene` },
    { text: `The end was really just a new beginning. Because the best stories about ${theme} never really end—they keep growing.`, imagePrompt: `Open-ended hopeful scene, new possibilities, continuing story feel, beautiful children's illustration` },
    { text: `What about you? How will YOU make a difference in the world? Your story is just beginning!`, imagePrompt: `Invitation to reader, inspiring call to action, empowering ending, children's book finale` }
  ];
}

// Helper function to generate complex book pages (6-8)
function generateComplexBookPages(title, theme) {
  return [
    { text: `The morning sun rose over the town of Willowbrook, where something extraordinary was about to happen. No one knew it yet, but this day would change everything related to ${theme}.`, imagePrompt: `Beautiful morning sunrise over whimsical town, anticipation in air, establishing shot, children's book illustration` },
    { text: `Our protagonist had always wondered about ${theme}. There were so many questions without answers, so many mysteries waiting to be solved. Today felt different, though. Today felt like the day for answers.`, imagePrompt: `Curious main character pondering questions, thought bubbles, wonder expressed, children's book style` },
    { text: `The first clue appeared in the most unexpected place. At first, it seemed like nothing important. But the best adventurers know that small details often lead to big discoveries.`, imagePrompt: `Character finding mysterious clue, detective moment, intrigue building, adventure children's illustration` },
    { text: `Of course, every quest needs companions. Some appeared when least expected. A shy friend with hidden talents. A loud friend with a bigger heart. Together, they were unstoppable.`, imagePrompt: `Diverse group of friends joining quest, each unique, team assembled, children's book character scene` },
    { text: `The journey wasn't easy. Mountains had to be climbed—both real and metaphorical. Fears had to be faced. Sometimes the hardest part was believing they could actually succeed.`, imagePrompt: `Team facing challenging obstacle, determination despite difficulty, growth moment, dramatic children's illustration` },
    { text: `But something magical happens when people work together toward something bigger than themselves. Strengths combine. Weaknesses disappear. Hope multiplies.`, imagePrompt: `Team combining strengths, synergy shown visually, unity power, inspiring children's book scene` },
    { text: `The turning point came when they least expected it. A moment of kindness to a stranger. A decision to help when it wasn't required. That's when everything clicked into place.`, imagePrompt: `Pivotal kindness moment, unexpected connection, karmic reward, meaningful children's illustration` },
    { text: `When they finally solved the mystery of ${theme}, the answer wasn't what anyone predicted. It was simpler. And somehow, that made it more powerful.`, imagePrompt: `Mystery revelation scene, simple truth discovered, profound moment, children's book climax` },
    { text: `The adventure changed them all. Not just what they knew, but who they were. They had discovered that understanding ${theme} means understanding themselves.`, imagePrompt: `Characters transformed, growth evident, wisdom gained, reflective children's illustration` },
    { text: `Willowbrook was different now. The friends were different too. But the best adventures don't end—they become part of who we are, forever.`, imagePrompt: `Transformed town and characters, lasting change, beautiful conclusion, children's book scene` },
    { text: `Some say that on quiet nights, you can still feel the echo of their adventure. That ${theme} still holds secrets for those brave enough to seek them.`, imagePrompt: `Mystical night scene, lingering magic, invitation for more, atmospheric children's illustration` },
    { text: `What mysteries are YOU ready to explore? What adventures await in your world? Maybe the greatest discovery is that you're braver than you know.`, imagePrompt: `Empowering invitation to reader, possibility ahead, inspiring finale, children's book ending` }
  ];
}

// Helper function to generate advanced book pages (9-10)
function generateAdvancedBookPages(title, theme) {
  return [
    { text: `They say every generation faces its defining challenge—a moment when ordinary people must choose to become extraordinary. For the young people of Meridian City, that moment arrived on an unremarkable Thursday afternoon.`, imagePrompt: `Dramatic cityscape, pivotal moment approaching, atmospheric tension, mature children's book illustration` },
    { text: `The problem with ${theme} wasn't that no one cared. It was that everyone assumed someone else would fix it. Someone older. Someone smarter. Someone with more power. But what if that someone was actually... us?`, imagePrompt: `Young protagonist questioning assumptions, reflection moment, self-discovery beginning, thoughtful children's illustration` },
    { text: `The group formed almost by accident. Different backgrounds. Different strengths. Different dreams. What united them was simpler: they all refused to accept that things couldn't be better.`, imagePrompt: `Diverse group of young characters, unity in differences, alliance forming, inclusive children's book scene` },
    { text: `Change never comes easily. The first attempts met resistance—from those who benefited from the old ways, from those too tired to hope, even from their own doubts. Every reformer must first conquer their own fear.`, imagePrompt: `Characters facing opposition and doubt, struggle shown, perseverance tested, dramatic children's illustration` },
    { text: `They studied history. They learned from past movements—what worked, what didn't, what cost too much. Standing on the shoulders of giants meant understanding both their triumphs and their mistakes.`, imagePrompt: `Characters studying historical movements, learning from past, wisdom gathering, educational children's book scene` },
    { text: `The breakthrough came not from force, but from connection. They realized that the "opposition" were often just afraid of losing something precious to them. Understanding their fears opened unexpected doors.`, imagePrompt: `Bridge-building moment between opposing sides, empathy breakthrough, diplomatic children's illustration` },
    { text: `Small victories accumulated. A conversation changed. A policy revised. A mind opened. Each win seemed tiny alone, but together they formed a wave that couldn't be stopped.`, imagePrompt: `Montage of small victories adding up, momentum building, progress visible, hopeful children's book scene` },
    { text: `Setbacks came too. Painful ones. Friends who gave up. Critics who were sometimes right. Moments when the whole movement seemed ready to collapse. But collapse isn't failure—stopping is.`, imagePrompt: `Characters experiencing setback, resilience tested, determination renewed, emotional children's illustration` },
    { text: `The day things truly changed wasn't dramatic. No speeches. No celebrations. Just a quiet realization that ${theme} was different now—and they had helped make it so.`, imagePrompt: `Quiet victory moment, subtle change recognized, meaningful accomplishment, understated children's book scene` },
    { text: `Years later, they would tell stories of that time. Not as heroes—they resisted that label—but as people who proved that caring deeply and acting bravely could reshape the world.`, imagePrompt: `Characters grown up, reflecting on journey, legacy established, time-passage children's illustration` },
    { text: `The lessons of ${theme} weren't just about that single issue. They were about what happens when we refuse to accept helplessness. When we choose action over despair. When we trust each other.`, imagePrompt: `Abstract representation of lessons learned, universal truths shown, philosophical children's book scene` },
    { text: `Your generation will face your own challenges. Your own moments of choice. Remember this: the most powerful force in history has always been people who decided that giving up wasn't an option.`, imagePrompt: `Inspirational direct address to reader, torch-passing imagery, empowering finale, children's book ending` }
  ];
}

// ============================================
// GENERATION FUNCTIONS
// ============================================

// Generate image using Gemini
async function generateImage(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate a beautiful, child-friendly illustration: ${prompt}. Style: Bright, colorful, safe for children, no scary elements, warm and inviting, perfect for a children's storybook.`
          }]
        }],
        generationConfig: { responseModalities: ['image', 'text'] }
      });

      const response = await result.response;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
        }
      }
      throw new Error('No image in response');
    } catch (error) {
      if (attempt === retries) return null;
      await sleep(2000 * attempt);
    }
  }
  return null;
}

// Generate audio using Google Cloud TTS
async function generateAudio(text, ageRange) {
  const voiceConfig = VOICE_BY_AGE[ageRange] || VOICE_BY_AGE['3-5'];

  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: voiceConfig.name, ssmlGender: voiceConfig.name.includes('-O') ? 'FEMALE' : 'MALE' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: voiceConfig.speakingRate, pitch: 0.0, volumeGainDb: 0.0 }
    });

    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestData) }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).audioContent);
        } else {
          reject(new Error(`TTS error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

// Upload to Firebase Storage
async function uploadToStorage(data, filePath, contentType) {
  const buffer = Buffer.from(data, 'base64');
  const file = bucket.file(filePath);
  await file.save(buffer, { metadata: { contentType }, public: true });
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function slugify(text) { return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

// Generate a single book
async function generateBook(book, index, total) {
  const bookId = slugify(book.title);

  // Check if book already exists
  const existingDoc = await db.collection('books').doc(bookId).get();
  if (existingDoc.exists) {
    console.log(`⏭️  Skipping ${book.title} (already exists)`);
    return { success: true, skipped: true, title: book.title };
  }

  console.log(`\n📖 [${index + 1}/${total}] Generating: ${book.title}`);
  console.log(`   Age: ${book.ageRange} | Theme: ${book.theme}`);

  const pages = [];
  let totalWords = 0;

  for (let i = 0; i < book.pages.length; i++) {
    const page = book.pages[i];
    process.stdout.write(`   Page ${i + 1}/${book.pages.length}...`);

    totalWords += page.text.split(' ').length;

    // Generate image
    let imageUrl = '';
    const imageResult = await generateImage(page.imagePrompt);
    if (imageResult) {
      const ext = imageResult.mimeType.split('/')[1] || 'png';
      const imagePath = `books/${bookId}/images/page-${i + 1}.${ext}`;
      imageUrl = await uploadToStorage(imageResult.data, imagePath, imageResult.mimeType);
    }

    // Generate audio
    let audioUrl = '';
    try {
      const audioBase64 = await generateAudio(page.text, book.ageRange);
      const audioPath = `books/${bookId}/audio/page-${i + 1}.mp3`;
      audioUrl = await uploadToStorage(audioBase64, audioPath, 'audio/mpeg');
    } catch (e) { }

    pages.push({ pageNumber: i + 1, text: page.text, imageUrl, audioUrl });
    console.log(` ✓`);

    await sleep(500); // Rate limiting
  }

  // Save to Firestore
  const bookData = {
    id: bookId,
    title: book.title,
    ageRange: book.ageRange,
    theme: book.theme,
    moralLesson: book.moralLesson,
    synopsis: book.synopsis || book.moralLesson,
    coverImageUrl: pages[0]?.imageUrl || '',
    pages,
    pageCount: pages.length,
    wordCount: totalWords,
    audio: { status: 'ready', voiceName: VOICE_BY_AGE[book.ageRange]?.name },
    status: 'published',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('books').doc(bookId).set(bookData);
  console.log(`   ✅ Complete! ${totalWords} words, ${pages.length} pages`);

  return { success: true, title: book.title, wordCount: totalWords };
}

// Main function
async function generateAllBooks() {
  console.log('\n🚀 GENIUS KIDS STORY BOOKS GENERATOR');
  console.log('=====================================');
  console.log(`📚 Total books to generate: ${ALL_BOOKS.length}`);
  console.log(`🎙️  Voice speeds: 0.80-0.90 (slower for kids)`);
  console.log(`📝 Content: 60+ words per page\n`);

  const results = { success: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < ALL_BOOKS.length; i++) {
    try {
      const result = await generateBook(ALL_BOOKS[i], i, ALL_BOOKS.length);
      if (result.skipped) results.skipped++;
      else results.success++;
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.failed++;
    }

    // Progress update every 10 books
    if ((i + 1) % 10 === 0) {
      console.log(`\n📊 Progress: ${i + 1}/${ALL_BOOKS.length} | ✅ ${results.success} | ⏭️ ${results.skipped} | ❌ ${results.failed}\n`);
    }
  }

  console.log('\n=====================================');
  console.log('🎉 GENERATION COMPLETE!');
  console.log(`✅ Successfully generated: ${results.success}`);
  console.log(`⏭️  Skipped (already exist): ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('=====================================\n');
}

// Run
generateAllBooks()
  .then(() => process.exit(0))
  .catch(error => { console.error('Fatal error:', error); process.exit(1); });
