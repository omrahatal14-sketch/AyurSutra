const express = require('express');
const router = express.Router();

// Local Ayurvedic Knowledge Base for RAG (Retrieval)
const therapies = [
  { name: "Abhyanga (Massage)", description: "Full body massage with medicated oils. Good for Vata imbalance, fatigue, and stress.", keywords: ["vata", "fatigue", "stress", "massage", "oil", "body", "pain"] },
  { name: "Shirodhara (Oil Pouring)", description: "Continuous pouring of warm oil on the forehead. Great for mental stress, insomnia, and Pitta imbalance.", keywords: ["pitta", "stress", "insomnia", "sleep", "mind", "head", "forehead", "oil"] },
  { name: "Vamana (Emesis Therapy)", description: "Therapeutic vomiting to eliminate excess Kapha. Used for asthma, allergies, and skin diseases.", keywords: ["kapha", "asthma", "allergy", "allergies", "skin", "vomit", "congestion"] },
  { name: "Virechana (Purgation Therapy)", description: "Medicated purgation for Pitta imbalance. Good for liver disorders, acne, and hyperacidity.", keywords: ["pitta", "liver", "acne", "pimple", "acidity", "digestion", "stomach"] },
  { name: "Basti (Enema Therapy)", description: "Herbal enemas for Vata imbalance. Essential for joint pain, arthritis, and neurological issues.", keywords: ["vata", "joint", "pain", "arthritis", "enema", "neuro", "bones"] },
  { name: "Nasya (Nasal Administration)", description: "Medicated oils through the nose. Good for migraines, sinus issues, and neck stiffness.", keywords: ["nose", "nasal", "migraine", "headache", "sinus", "neck", "stiff"] },
  { name: "Raktamokshana (Bloodletting)", description: "Purifies the blood. Used for chronic skin diseases.", keywords: ["blood", "skin", "disease", "purify", "detox"] },
  { name: "Kati Basti (Back Care)", description: "Dough pool on the lower back filled with warm oil. Excellent for back pain and sciatica.", keywords: ["back", "pain", "sciatica", "lower back", "spine"] },
  { name: "Janu Basti (Knee Care)", description: "Dough pool on knees. Good for osteoarthritis.", keywords: ["knee", "joint", "arthritis", "osteoarthritis", "legs"] },
  { name: "Griva Basti (Neck Care)", description: "Dough pool on the neck. Relieves cervical spondylosis.", keywords: ["neck", "pain", "cervical", "spondylosis"] },
  { name: "Udvartana (Powder Massage)", description: "Dry powder massage. Excellent for weight loss, obesity, and Kapha reduction.", keywords: ["weight", "loss", "obesity", "fat", "kapha", "powder", "massage"] },
  { name: "Pizhichil (Oil Bath)", description: "Squeezing warm medicated oil over the body. Good for paralysis, arthritis, and nervous disorders.", keywords: ["paralysis", "arthritis", "nerve", "nervous", "oil", "bath"] },
  { name: "Navarakizhi (Rice Bolus)", description: "Massage with medicated rice boluses. Rejuvenating, good for muscle wasting.", keywords: ["muscle", "weak", "wasting", "rejuvenate", "massage", "rice"] },
  { name: "Swedana (Herbal Steam)", description: "Sweating therapy to open pores and release toxins. Usually follows Abhyanga.", steam: ["steam", "sweat", "toxin", "pore", "detox"] },
  { name: "Netra Tarpana (Eye Care)", description: "Dough pool around eyes filled with ghee. Improves vision and relieves eye strain.", keywords: ["eye", "vision", "strain", "ghee", "sight"] },
  { name: "Karnapoorana (Ear Care)", description: "Warm oil in ears. Good for tinnitus and earache.", keywords: ["ear", "tinnitus", "ache", "pain", "hearing"] }
];

// Helper function to extract user query
function extractUserQuery(messages) {
  if (!messages || messages.length === 0) return "";
  // Find the last user message
  const lastMsg = [...messages].reverse().find(m => m.role === 'user');
  if (lastMsg && lastMsg.parts && lastMsg.parts[0]) {
    return lastMsg.parts[0].text.toLowerCase();
  }
  return "";
}

// Simulated Local RAG Model
router.post('/chat', async (req, res) => {
  const { messages, systemInstruction } = req.body;
  
  try {
    const query = extractUserQuery(messages);
    if (!query) {
      return res.json({ text: "Please provide a valid question or symptoms." });
    }

    // Tokenize query into words
    const queryWords = query.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2);
    
    // Retrieval phase (Scoring documents)
    let scoredTherapies = therapies.map(t => {
      let score = 0;
      const keys = t.keywords || t.steam || []; // Fallback for swedana typo in keys above
      
      // Check if therapy name matches
      if (query.includes(t.name.toLowerCase().split(' ')[0])) score += 5;

      queryWords.forEach(word => {
        if (keys.includes(word)) score += 2;
        if (t.description.toLowerCase().includes(word)) score += 1;
      });

      return { ...t, score };
    });

    // Filter and sort matches
    scoredTherapies = scoredTherapies.filter(t => t.score > 0).sort((a, b) => b.score - a.score);

    // Generation phase (Constructing response)
    let responseText = "";

    // Specific format expected by "Consult AI" page
    if (systemInstruction && systemInstruction.includes("diagnostician")) {
      if (scoredTherapies.length === 0) {
        // Fallback for consult
        responseText = "THERAPY: Abhyanga (Massage) | REASON: General relaxation and detoxification.\nTHERAPY: Swedana (Herbal Steam) | REASON: Opens up pores to release mild toxins.";
      } else {
        const top2 = scoredTherapies.slice(0, 2);
        responseText = top2.map(t => `THERAPY: ${t.name} | REASON: ${t.description}`).join("\n");
        if (top2.length === 1) {
          responseText += "\nTHERAPY: Swedana (Herbal Steam) | REASON: An excellent supplementary therapy for detoxification.";
        }
      }
    } else {
      // General Chatbot Response
      if (scoredTherapies.length === 0) {
        responseText = "I am a local AI Ayurvedic Assistant. Based on your input, I couldn't find a specific therapy, but Ayurveda focuses on balancing the Doshas (Vata, Pitta, Kapha). How else can I help you with Panchakarma?";
      } else {
        responseText = "Based on our local Ayurvedic knowledge base, here are the most relevant therapies for your symptoms:<br><br>";
        scoredTherapies.slice(0, 3).forEach((t, i) => {
          responseText += `<b>${i+1}. ${t.name}</b>: ${t.description}<br><br>`;
        });
        responseText += "<i>Please consult our doctors for a personalized diagnosis.</i>";
      }
    }

    // Simulate slight network delay for realistic "AI" feel
    setTimeout(() => {
      res.json({ text: responseText });
    }, 800);

  } catch (err) {
    console.error("Local Model Error:", err.message);
    res.status(500).json({ error: "Local model processing error: " + err.message });
  }
});

module.exports = router;
