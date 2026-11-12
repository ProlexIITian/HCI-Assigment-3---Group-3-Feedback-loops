/**
 * Market-domain lexicon used by the on-phone act recogniser (Solution A) and by the
 * domain-restricted translator stand-in (Solution B). Keys are act ids, so the same
 * recogniser serves both designs. Keywords are matched as substrings of tokens, so
 * inflections ("पुराने", "पुरानी") are covered by a stem ("पुरान").
 * Romanised Hindi/Marathi is included because market speech is code-mixed (R84).
 */
export const INTENT_KEYS: Record<string, string[]> = {
  hello: ['नमस्ते', 'नमस्कार', 'राम राम', 'प्रणाम', 'નમસ્તે', 'કેમ છો', 'নমস্কার', 'hello', 'namaste', 'namaskar', 'good morning', 'राम राम', 'રામ રામ', 'কী খবর', 'hey there', 'कसे आहात', 'केम छो'],
  thanks: ['धन्यवाद', 'शुक्रिया', 'आभार', 'થેંક', 'આભાર', 'ধন্যবাদ', 'thank', 'dhanyavad', 'shukriya', 'थँक्यू', 'থ্যাংক', 'thanks', 'आभार', 'শুক্রিয়া'],
  bye: ['फिर मिलेंगे', 'पुन्हा भेटू', 'ફરી મળીશું', 'আবার দেখা', 'goodbye', 'bye', 'see you', 'भेटू', 'मिलते हैं', 'મળીએ', 'મળીશું', 'আসি', 'চলি', 'দেখা হবে', 'see you'],
  findveg: ['सब्ज़ी कहाँ', 'सब्जी कहाँ', 'भाजी कुठे', 'શાક ક્યાં', 'શાકભાજી ક્યાં', 'সবজি কোথায়', 'where are the vegetables', 'where are vegetables', 'भाजी कुठ', 'सब्ज़ी किधर', 'सब्जी किधर', 'find vegetables', 'the veg', 'where’s the veg', 'शाक क्यां'],
  findwater: ['पानी कहाँ', 'पाणी कुठे', 'પાણી ક્યાં', 'জল কোথায়', 'where is water', 'drinking water', 'पाणी कुठ', 'पानी किधर', 'where’s water', 'where\'s water', 'get drinking water'],
  haveit: ['है क्या', 'आहे का', 'છે કે', 'আছে কি', 'do you have', 'have this', 'आपल्याकडे मिळेल', 'हाय का', 'आपके पास है', 'यह है?', 'આપની પાસે છે', 'આ છે?', 'got this', 'have this'],
  othertype: ['दूसरी किस्म', 'दुसरा प्रकार', 'બીજી જાત', 'অন্য রকম', 'another kind', 'other variety', 'another variety', 'आणखी कुठला', 'और कोई है', 'બીજું કંઈ', 'any other kind', 'another kind', 'दुसरा प्रकार', 'बीजी जात'],
  pack: ['पैक', 'बांध', 'बाँध', 'थैली', 'પૅક', 'પેક', 'બાંધ', 'প্যাক', 'pack', 'bag it'],
  qtykg: ['चाहिए', 'हवे', 'हवा', 'जोईए', 'જોઈએ', 'লাগবে', 'i want', 'i need'],
  half: ['आधा किलो', 'अर्धा किलो', 'અડધો કિલો', 'আধ কেজি', 'half a kilo', 'half kilo', 'half kg'],
  little: ['थोड़ा और', 'थोडा और', 'थोडं आणखी', 'अजून थोडं', 'થોડું વધારે', 'હજી થોડું', 'আর একটু', 'a little more', 'bit more'],
  fresh: ['ताज़ा', 'ताजा', 'ताज़े', 'ताजे', 'ताजं', 'ताजी', 'તાજું', 'તાજા', 'তাজা', 'fresh', 'taza', 'taaza'],
  old: ['पुरान', 'बासी', 'ख़राब', 'खराब', 'सड़', 'जुन', 'शिळ', 'જૂન', 'જૂની', 'વાસી', 'બગડ', 'ખરાબ', 'পুরনো', 'পুরোনো', 'বাসি', 'পচা', 'old', 'stale', 'purana', 'purane', 'kharab'],
  another: ['दूसरा दिखा', 'दूसरा वाला', 'दुसरं दाखव', 'दुसरे दाखव', 'બીજું બતાવ', 'অন্যটা দেখা', 'show another', 'another one', 'show me another', 'ते दाखवा', 'वो वाला दिखा', 'પેલું બતાવ', 'ওটা দেখা', 'that one', 'another one'],
  taste: ['चख', 'चाख', 'ચાખ', 'চেখে', 'চাখ', 'taste', 'ચખાડ'],
  howmuch: ['कितने', 'कितना', 'किती', 'क्या भाव', 'काय भाव', 'કેટલા', 'શું ભાવ', 'কত', 'কী দর', 'how much', 'what price', 'kitne', 'kitna', 'kiti', "what's the rate", 'rate kya', 'भाव काय', 'दाम क्या', 'कितीला', 'आनो भाव', 'ભાવ શું', 'દામ', 'দাম কত', 'what would the price', 'the rate', 'rate?'],
  counter: ['दूँगी', 'दूंगी', 'दूँगा', 'दूंगा', 'दे दो', 'दे दीजिए', 'दे दीजिये', 'लगा लो', 'लगाओ', 'कम कर', 'देईन', 'देते', 'द्याल', 'द्या', 'लावा', 'कमी कर', 'આપીશ', 'આપશો', 'આપો', 'લગાવો', 'ઓછું કર', 'দেব', 'দেবেন', 'দিন', 'ধরো', 'কমিয়ে', 'give', 'pay', 'do it for', 'make it', 'dungi', 'dunga', 'de do', 'kam karo', 'less'],
  final: ['आख़िरी', 'आखिरी', 'अंतिम', 'शेवटच', 'છેલ્લ', 'শেষ দাম', 'final', 'last price', 'aakhri', 'akhri'],
  tooexp: ['महँगा', 'महंगा', 'मँहगा', 'ज़्यादा है', 'ज्यादा है', 'बहुत ज़्यादा', 'महाग', 'जास्त आहे', 'मोंघ', 'મોંઘ', 'વધારે છે', 'দামি', 'অনেক দাম', 'বেশি', 'expensive', 'too much', 'mehnga', 'mahanga', 'costly', 'जास्त वाटत', 'ज़्यादा लग', 'ज्यादा लग', 'વધારે લાગ', 'বেশি মনে'],
  accept: ['ठीक है', 'मंज़ूर', 'मंजूर', 'पक्का', 'ठीक आहे', 'मान्य', 'चालेल', 'સારું', 'મંજૂર', 'પાક્કું', 'ચાલશે', 'ঠিক আছে', 'রাজি', 'পাকা', 'okay', 'ok', 'deal', 'agreed', 'theek hai', 'done', 'पक्कं'],
  refuse: ['नहीं चाहिए', 'रहने दो', 'रहने दीजिए', 'छोड़ो', 'नको', 'राहू द्या', 'નથી જોઈતું', 'રહેવા દો', 'ছাড়ো', 'থাক', 'no thanks', 'leave it', 'forget it', 'not now', 'ના ભાઈ, છોડો', 'छोड़ो', 'સોડો'],
  upi: ['upi', 'यूपीआई', 'gpay', 'phonepe', 'paytm', 'ऑनलाइन', 'qr', 'ઓનલાઇન', 'অনলাইন'],
  cash: ['नकद', 'कैश', 'रोख', 'રોકડ', 'કૅશ', 'নগদ', 'cash', 'कॅश', 'કૅશ'],
  change: ['छुट्टे', 'खुल्ले', 'सुटे', 'છૂટા', 'খুচরো', 'change', 'छुट्टा'],
  deliver: ['घर पहुँचा', 'घर पहुंचा', 'घरपोच', 'घरी पोच', 'घरी पाठव', 'ઘરે પહોંચ', 'ઘરે મોકલ', 'বাড়িতে', 'deliver', 'home delivery', 'घर भिजवा', 'send it home', 'deliver this'],
  when: ['कब आएगा', 'कब तक', 'कधी येईल', 'ક્યારે આવશે', 'কখন আসবে', 'when will', 'कधीपर्यंत', 'कधी?', 'ક્યાં સુધીમાં', 'ક્યારે', 'when?', 'when will it'],
  weightshort: ['तौल कम', 'वजन कम', 'वज़न कम', 'वजन कमी', 'વજન ઓછું', 'ওজন কম', 'weight is short', 'short weight', 'weight seems short', 'underweight', 'वजन थोडं कमी', 'तौल थोड़ी कम', 'વજન થોડું ઓછું', 'weight is a little short', 'weight’s short', 'weight\'s short'],
  wrongitem: ['गलत सामान', 'ग़लत', 'चुकीच', 'ખોટો', 'ભુલથી', 'ভুল জিনিস', 'wrong item', 'wrong one', 'दुसरा माल', 'तो माल नाही', 'दूसरा सामान', 'वह सामान नहीं', 'गलत है', 'બીજો માલ', 'એ માલ નથી', 'ખોટું છે', 'different item', 'not the item', 'wrong'],
  slow: ['धीरे', 'हळू', 'ધીમે', 'ধীরে', 'আস্তে', 'slowly', 'slow down', 'dheere', 'slower'],
  again: ['फिर से', 'दोबारा', 'छोटे में', 'पुन्हा सांग', 'थोडक्यात', 'ફરી કહો', 'ટૂંકમાં', 'আবার বলুন', 'ছোট করে', 'again', 'repeat', 'shorter', 'सरळ सांगा', 'सीधा बोलो', 'સીધું કહો', 'সোজা বলো', 'short version'],
  shownum: ['लिखकर', 'लिख दो', 'नंबर दबा', 'आकडा दाखव', 'लिहून', 'આંકડો બતાવ', 'લખી', 'সংখ্যায়', 'লিখে', 'show the number', 'write it', 'type the number', 'स्क्रीन', 'आकडा दाबा', 'આંકડ', 'સ્ક્રીન', 'স্ক্রিন', 'নম্বর টেপ', 'on the screen', 'tap the number'],
};

/** What a seller typically says (Solution A seller-side recognition and B replies). */
export const SELLER_KEYS: Record<string, string[]> = {
  accept: INTENT_KEYS.accept.concat(['ले जाइए', 'ले लो', 'घेऊन जा', 'લઈ જાઓ', 'নিয়ে যান', 'take it']),
  refuse: ['नहीं होगा', 'नहीं दे सकता', 'जमणार नाही', 'નહીં થાય', 'হবে না', 'not possible', 'cannot'],
};

/** Goods (used for the meaning summary and the round-trip display). */
export const ITEMS: Record<string, { keys: string[]; en: string }> = {
  onion: { keys: ['प्याज', 'प्याज़', 'कांद', 'ડુંગળી', 'કાંદ', 'পেঁয়াজ', 'onion', 'pyaz', 'pyaaz', 'kanda'], en: 'onions' },
  tomato: { keys: ['टमाटर', 'टोमॅटो', 'ટામેટ', 'টমেটো', 'tomato', 'tamatar'], en: 'tomatoes' },
  potato: { keys: ['आलू', 'बटाट', 'બટાક', 'আলু', 'potato', 'aloo', 'batata'], en: 'potatoes' },
  groundnut: { keys: ['मूंगफली', 'मूँगफली', 'शेंगदाण', 'મગફળી', 'સિંગ', 'চিনাবাদাম', 'groundnut', 'peanut'], en: 'groundnuts' },
  chilli: { keys: ['मिर्च', 'मिरच', 'મરચ', 'লঙ্কা', 'chilli', 'chili'], en: 'chillies' },
  banana: { keys: ['केला', 'केले', 'केळ', 'કેળ', 'কলা', 'banana'], en: 'bananas' },
  veg: { keys: ['सब्ज़ी', 'सब्जी', 'भाजी', 'શાક', 'সবজি', 'vegetable', 'sabzi'], en: 'vegetables' },
};

/** Function words and fillers that carry no market content (count as understood). */
export const STOP = new Set(
  `ये यह वो वह है हैं था थे थी तो भी ही ना न के का की को में से पर और मैं मुझे हम आप तुम इस उस इसका इसके एक बार थोड़ा थोड़े थोड़ी थोडा कुछ बहुत लग लगता लगते लगती लग रहे रहा रही रहे हो होगा होंगे जी भैया भाई साहब दीदी बहन देखिए अरे बस अब अभी क्या
   हे ते तो ती आहे आहेत होते होती मी मला आम्ही तुम्ही त्या या थोडे थोडं थोडी काही खूप वाटते वाटतात वाटतंय दिसतात दिसते दिसत दादा ताई काका ना की आणि पण साठी साठ ला
   આ એ તે છે છો હતું હું મને અમે તમે આપ થોડું થોડી થોડા કંઈ બહુ લાગે લાગે છે દેખાય ભાઈ બેન કાકા ને તો પણ અને માટે ના
   এই ওই এটা ওটা এগুলো আমি আমাকে আপনি তুমি একটু খুব লাগছে মনে হচ্ছে দাদা দিদি তো না আর
   these this that those the a an is are was it its i me my we you your look looks looking seem seems bit little some very for of to and please sir madam brother bhaiya didi will would can could`
    .split(/\s+/)
    .filter(Boolean)
);
