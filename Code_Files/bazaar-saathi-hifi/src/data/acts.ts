import type { Lang } from '../i18n';

export type Register = 'respectful' | 'neutral' | 'familiar';
export const REGISTERS: Register[] = ['respectful', 'neutral', 'familiar'];
export const REG_I: Record<Register, number> = { respectful: 0, neutral: 1, familiar: 2 };

type L5 = Record<Lang, string>;
type Triple = [string, string, string]; // respectful, neutral, familiar
const L = (en: string, hi: string, mr: string, bn: string, gu: string): L5 => ({ en, hi, mr, bn, gu });

export interface Family { id: string; icon: string; label: L5 }

export const FAMILIES: Family[] = [
  { id: 'greet', icon: '🙏', label: L('Greet', 'अभिवादन', 'अभिवादन', 'শুভেচ্ছা', 'અભિવાદન') },
  { id: 'find', icon: '🧭', label: L('Find', 'ढूँढें', 'शोधा', 'খুঁজুন', 'શોધો') },
  { id: 'goods', icon: '🧺', label: L('Ask goods', 'सामान पूछें', 'माल विचारा', 'জিনিস জিজ্ঞেস', 'માલ પૂછો') },
  { id: 'qty', icon: '⚖️', label: L('Quantity', 'मात्रा', 'प्रमाण', 'পরিমাণ', 'જથ્થો') },
  { id: 'quality', icon: '🌿', label: L('Quality', 'गुणवत्ता', 'दर्जा', 'মান', 'ગુણવત્તા') },
  { id: 'price', icon: '₹', label: L('Price & bargain', 'दाम और मोलभाव', 'किंमत, घासाघीस', 'দাম ও দরদাম', 'ભાવ અને ભાવતાલ') },
  { id: 'pay', icon: '💵', label: L('Pay', 'भुगतान', 'पैसे देणे', 'পেমেন্ট', 'ચુકવણી') },
  { id: 'delivery', icon: '🚚', label: L('Delivery', 'डिलीवरी', 'घरपोच', 'ডেলিভারি', 'ડિલિવરી') },
  { id: 'complaint', icon: '❗', label: L('Complaint', 'शिकायत', 'तक्रार', 'অভিযোগ', 'ફરિયાદ') },
  { id: 'repair', icon: '🔁', label: L('Repair', 'सुधारें', 'दुरुस्ती', 'শুধরে নিন', 'સુધારો') },
];

export interface Act {
  id: string;
  family: string;
  icon: string;
  label: L5;
  /** Meaning shown to the buyer in her own language. {n} = number. */
  mean?: Partial<L5>;
  needsNumber?: boolean;
  unit?: 'rupees' | 'kg';
  /** Native-authored wording per target language and register. {n} = number. */
  w: Partial<Record<Lang, Triple>>;
}

export const ACTS: Act[] = [
  // ── greet
  { id: 'hello', family: 'greet', icon: '👋', label: L('Hello', 'नमस्ते', 'नमस्कार', 'নমস্কার', 'નમસ્તે'), w: {
    hi: ['नमस्ते भाई साहब, कैसे हैं आप?', 'नमस्ते भैया।', 'राम राम भैया!'],
    mr: ['नमस्कार दादा, कसे आहात?', 'नमस्कार दादा.', 'राम राम दादा!'],
    gu: ['નમસ્તે ભાઈ, કેમ છો આપ?', 'નમસ્તે ભાઈ.', 'રામ રામ ભાઈ!'],
    bn: ['নমস্কার দাদা, কেমন আছেন?', 'নমস্কার দাদা।', 'কী খবর দাদা!'],
    en: ['Good morning sir, how are you?', 'Hello.', 'Hey there!'] } },
  { id: 'thanks', family: 'greet', icon: '🤝', label: L('Thank you', 'धन्यवाद', 'धन्यवाद', 'ধন্যবাদ', 'આભાર'), w: {
    hi: ['बहुत-बहुत धन्यवाद, भाई साहब।', 'धन्यवाद भैया।', 'शुक्रिया भैया!'],
    mr: ['दादा, तुमचे खूप खूप आभार.', 'धन्यवाद दादा.', 'थँक्यू दादा!'],
    gu: ['ભાઈ, આપનો ખૂબ ખૂબ આભાર.', 'આભાર ભાઈ.', 'થેંક્યુ ભાઈ!'],
    bn: ['দাদা, আপনাকে অনেক ধন্যবাদ।', 'ধন্যবাদ দাদা।', 'থ্যাংক ইউ দাদা!'],
    en: ['Thank you very much, sir.', 'Thank you.', 'Thanks!'] } },
  { id: 'bye', family: 'greet', icon: '🚶', label: L('Goodbye', 'फिर मिलेंगे', 'पुन्हा भेटू', 'আবার দেখা হবে', 'ફરી મળીશું'), w: {
    hi: ['ठीक है भाई साहब, फिर मिलेंगे।', 'ठीक है भैया, फिर मिलते हैं।', 'चलो भैया, फिर मिलेंगे!'],
    mr: ['बरं दादा, आपण पुन्हा भेटू.', 'बरं दादा, भेटू.', 'चला दादा, भेटू!'],
    gu: ['સારું ભાઈ, આપણે ફરી મળીશું.', 'સારું ભાઈ, મળીએ.', 'ચાલો ભાઈ, મળીએ!'],
    bn: ['আচ্ছা দাদা, আপনার সঙ্গে আবার দেখা হবে।', 'আচ্ছা দাদা, আসি।', 'চলি দাদা!'],
    en: ['All right sir, see you again.', 'See you.', 'Bye!'] } },
  // ── find
  { id: 'findveg', family: 'find', icon: '🥬', label: L('Where are vegetables?', 'सब्ज़ी कहाँ मिलेगी?', 'भाजी कुठे मिळेल?', 'সবজি কোথায় পাব?', 'શાકભાજી ક્યાં મળશે?'), w: {
    hi: ['भाई साहब, कृपया बताइए, सब्ज़ी कहाँ मिलेगी?', 'भैया, सब्ज़ी कहाँ मिलेगी?', 'भैया, सब्ज़ी किधर है?'],
    mr: ['दादा, कृपया सांगाल का, भाजी कुठे मिळेल?', 'दादा, भाजी कुठे मिळेल?', 'दादा, भाजी कुठंय?'],
    gu: ['ભાઈ, જરા કહેશો, શાકભાજી ક્યાં મળશે?', 'ભાઈ, શાકભાજી ક્યાં મળશે?', 'ભાઈ, શાક ક્યાં છે?'],
    en: ['Excuse me sir, where can I find vegetables?', 'Where are the vegetables?', 'Hey, where’s the veg?'] } },
  { id: 'findwater', family: 'find', icon: '💧', label: L('Where is water?', 'पानी कहाँ मिलेगा?', 'पाणी कुठे मिळेल?', 'জল কোথায় পাব?', 'પાણી ક્યાં મળશે?'), w: {
    hi: ['भाई साहब, पीने का पानी कहाँ मिलेगा?', 'भैया, पानी कहाँ मिलेगा?', 'भैया, पानी किधर है?'],
    mr: ['दादा, कृपया सांगाल का, प्यायचं पाणी कुठे मिळेल?', 'दादा, पाणी कुठे मिळेल?', 'दादा, पाणी कुठंय?'],
    gu: ['ભાઈ, જરા કહેશો, પીવાનું પાણી ક્યાં મળશે?', 'ભાઈ, પાણી ક્યાં મળશે?', 'ભાઈ, પાણી ક્યાં છે?'],
    en: ['Excuse me sir, where can I get drinking water?', 'Where is water?', 'Hey, where’s water?'] } },
  // ── goods
  { id: 'haveit', family: 'goods', icon: '❓', label: L('Do you have this?', 'क्या यह है?', 'हे आहे का?', 'এটা আছে?', 'આ છે?'), w: {
    hi: ['भाई साहब, क्या यह आपके पास है?', 'भैया, यह है?', 'भैया, ये है क्या?'],
    mr: ['दादा, हे आपल्याकडे मिळेल का?', 'दादा, हे आहे का?', 'दादा, हे हाय का?'],
    gu: ['ભાઈ, આ આપની પાસે છે?', 'ભાઈ, આ છે?', 'ભાઈ, આ છે કે?'],
    en: ['Sir, would you have this?', 'Do you have this?', 'Got this?'] } },
  { id: 'othertype', family: 'goods', icon: '🔀', label: L('Another kind?', 'दूसरी किस्म?', 'दुसरा प्रकार?', 'অন্য রকম?', 'બીજી જાત?'), w: {
    hi: ['भाई साहब, क्या दूसरी किस्म भी मिलेगी?', 'भैया, दूसरी किस्म है?', 'भैया, और कोई है?'],
    mr: ['दादा, आपल्याकडे दुसरा प्रकारही मिळेल का?', 'दादा, दुसरा प्रकार आहे का?', 'दादा, आणखी कुठला आहे?'],
    gu: ['ભાઈ, આપની પાસે બીજી જાત પણ મળશે?', 'ભાઈ, બીજી જાત છે?', 'ભાઈ, બીજું કંઈ છે?'],
    en: ['Sir, would you have another variety?', 'Is there another kind?', 'Got any other kind?'] } },
  { id: 'pack', family: 'goods', icon: '🛍️', label: L('Pack it', 'पैक कर दें', 'बांधून द्या', 'প্যাক করে দিন', 'પૅક કરી આપો'), w: {
    hi: ['भाई साहब, कृपया इसे पैक कर दीजिए।', 'भैया, पैक कर दो।', 'भैया, बाँध दो!'],
    mr: ['दादा, कृपया हे बांधून द्याल का?', 'दादा, बांधून द्या.', 'दादा, बांधा!'],
    gu: ['ભાઈ, મહેરબાની કરીને પૅક કરી આપશો?', 'ભાઈ, પૅક કરી આપો.', 'ભાઈ, બાંધી દો!'],
    en: ['Sir, could you please pack it?', 'Pack it.', 'Bag it!'] } },
  // ── quantity
  { id: 'qtykg', family: 'qty', icon: '⚖️', needsNumber: true, unit: 'kg', label: L('Give me … kg', 'इतने किलो दें', 'इतके किलो द्या', 'এত কেজি দিন', 'આટલા કિલો આપો'),
    mean: { en: 'Please give me {n} kg.', hi: 'मुझे {n} किलो दीजिए।', mr: 'मला {n} किलो द्या.', gu: 'મને {n} કિલો આપો.' }, w: {
    hi: ['भाई साहब, मुझे {n} किलो दे दीजिए।', 'भैया, {n} किलो दे दो।', 'भैया, {n} किलो डाल दो!'],
    mr: ['दादा, मला {n} किलो द्याल का?', 'दादा, {n} किलो द्या.', 'दादा, {n} किलो टाका!'],
    gu: ['ભાઈ, મને {n} કિલો આપશો?', 'ભાઈ, {n} કિલો આપો.', 'ભાઈ, {n} કિલો નાખો!'],
    bn: ['দাদা, আমাকে {n} কেজি দেবেন?', 'দাদা, {n} কেজি দিন।', 'দাদা, {n} কেজি দাও!'],
    en: ['Sir, could I have {n} kg, please?', '{n} kg.', 'Gimme {n} kg!'] } },
  { id: 'half', family: 'qty', icon: '½', label: L('Half a kg', 'आधा किलो', 'अर्धा किलो', 'আধ কেজি', 'અડધો કિલો'), w: {
    hi: ['भाई साहब, आधा किलो दे दीजिए।', 'भैया, आधा किलो दो।', 'भैया, आधा किलो डालो!'],
    mr: ['दादा, अर्धा किलो द्याल का?', 'दादा, अर्धा किलो द्या.', 'दादा, अर्धा किलो टाका!'],
    gu: ['ભાઈ, અડધો કિલો આપશો?', 'ભાઈ, અડધો કિલો આપો.', 'ભાઈ, અડધો કિલો નાખો!'],
    en: ['Sir, half a kilo, please.', 'Half a kilo.', 'Half a kilo!'] } },
  { id: 'little', family: 'qty', icon: '➕', label: L('A little more', 'थोड़ा और', 'थोडं आणखी', 'আর একটু', 'થોડું વધારે'), w: {
    hi: ['भाई साहब, थोड़ा और डाल दीजिए।', 'भैया, थोड़ा और डालो।', 'भैया, थोड़ा और!'],
    mr: ['दादा, थोडं आणखी घालाल का?', 'दादा, थोडं आणखी घाला.', 'दादा, अजून थोडं!'],
    gu: ['ભાઈ, થોડું વધારે નાખશો?', 'ભાઈ, થોડું વધારે નાખો.', 'ભાઈ, હજી થોડું!'],
    en: ['Sir, a little more, please.', 'A little more.', 'Bit more!'] } },
  // ── quality
  { id: 'fresh', family: 'quality', icon: '🌱', label: L('Is it fresh?', 'क्या यह ताज़ा है?', 'हे ताजे आहे का?', 'এটা কি তাজা?', 'શું આ તાજું છે?'), w: {
    hi: ['भाई साहब, क्या यह ताज़ा है?', 'भैया, यह ताज़ा है?', 'भैया, ताज़ा है ना?'],
    mr: ['दादा, हे ताजं आहे ना, सांगाल का?', 'दादा, हे ताजं आहे?', 'दादा, ताजं आहे ना?'],
    gu: ['ભાઈ, જરા કહેશો, આ તાજું છે?', 'ભાઈ, આ તાજું છે?', 'ભાઈ, તાજું છે ને?'],
    bn: ['দাদা, বলবেন, এটা কি তাজা?', 'দাদা, এটা তাজা?', 'দাদা, তাজা তো?'],
    en: ['Sir, is this fresh?', 'Is this fresh?', 'This is fresh, right?'] } },
  { id: 'old', family: 'quality', icon: '🍂', label: L('Looks a bit old', 'थोड़ा पुराना लगता है', 'थोडे जुने वाटते', 'একটু পুরনো লাগছে', 'થોડું જૂનું લાગે છે'),
    mean: { en: "These aren't a little old, are they? (asks, does not accuse)", hi: 'ये थोड़े पुराने तो नहीं हैं? (पूछना, इल्ज़ाम नहीं)', mr: 'हे थोडे जुने तर नाही ना? (विचारणे, आरोप नाही)', gu: 'આ થોડું જૂનું તો નથી ને? (પૂછવું, આરોપ નહીં)' }, w: {
    hi: ['भाई साहब, ये थोड़े पुराने तो नहीं हैं?', 'भैया, ये कुछ पुराने लग रहे हैं।', 'भैया, ये तो पुराने हैं!'],
    mr: ['दादा, माफ करा, हे थोडं जुनं तर नाही ना?', 'दादा, हे जुनं वाटतंय.', 'दादा, हे तर जुनं आहे!'],
    gu: ['ભાઈ, માફ કરજો, આ થોડું જૂનું તો નથી ને?', 'ભાઈ, આ જૂનું લાગે છે.', 'ભાઈ, આ તો જૂનું છે!'],
    bn: ['দাদা, কিছু মনে করবেন না, এগুলো একটু পুরনো নয় তো?', 'দাদা, এগুলো পুরনো লাগছে।', 'দাদা, এগুলো তো পুরনো!'],
    en: ["Sir, these aren't a little old, are they?", 'These look a bit old.', 'Hey, these are old!'] } },
  { id: 'another', family: 'quality', icon: '👁️', label: L('Show another', 'दूसरा दिखाएँ', 'दुसरे दाखवा', 'অন্যটা দেখান', 'બીજું બતાવો'), w: {
    hi: ['भाई साहब, कृपया दूसरा दिखा दीजिए।', 'भैया, दूसरा दिखाओ।', 'भैया, वो वाला दिखाओ।'],
    mr: ['दादा, कृपया दुसरं दाखवाल का?', 'दादा, दुसरं दाखवा.', 'दादा, ते दाखवा.'],
    gu: ['ભાઈ, મહેરબાની કરીને બીજું બતાવશો?', 'ભાઈ, બીજું બતાવો.', 'ભાઈ, પેલું બતાવો.'],
    bn: ['দাদা, দয়া করে অন্যটা দেখাবেন?', 'দাদা, অন্যটা দেখান।', 'দাদা, ওটা দেখাও।'],
    en: ['Sir, could you please show me another one?', 'Show me another one.', 'Show me that one.'] } },
  { id: 'taste', family: 'quality', icon: '🤲', label: L('Can I taste?', 'चख सकते हैं?', 'चाखू का?', 'চেখে দেখব?', 'ચાખું?'), w: {
    hi: ['भाई साहब, क्या एक बार चखकर देख लूँ?', 'भैया, चख लूँ?', 'भैया, ज़रा चखाओ!'],
    mr: ['दादा, आपण परवानगी दिली तर एकदा चाखून पाहू का?', 'दादा, चाखू का?', 'दादा, जरा चाखू द्या!'],
    gu: ['ભાઈ, આપ રજા આપો તો એકવાર ચાખી જોઉં?', 'ભાઈ, ચાખું?', 'ભાઈ, જરા ચખાડો!'],
    bn: ['দাদা, একটু চেখে দেখতে পারি?', 'দাদা, চাখব?', 'দাদা, একটু চাখাও!'],
    en: ['Sir, may I taste it once?', 'Can I taste it?', 'Let me taste!'] } },
  // ── price & bargain
  { id: 'howmuch', family: 'price', icon: '❔', label: L('How much?', 'कितने का?', 'किती?', 'কত?', 'કેટલાનું?'),
    mean: { en: 'What is the price?', hi: 'दाम क्या है?', mr: 'भाव काय आहे?', gu: 'ભાવ શું છે?' }, w: {
    hi: ['भाई साहब, इसका दाम क्या होगा?', 'भैया, कितने का है?', 'भैया, क्या भाव?'],
    mr: ['दादा, कृपया सांगाल का, याचा भाव काय आहे?', 'दादा, कितीला आहे?', 'दादा, काय भाव?'],
    gu: ['ભાઈ, જરા કહેશો, આનો ભાવ શું છે?', 'ભાઈ, કેટલામાં છે?', 'ભાઈ, શું ભાવ?'],
    bn: ['দাদা, বলবেন, এর দাম কত হবে?', 'দাদা, কত করে?', 'দাদা, কী দর?'],
    en: ['Sir, what would the price be?', 'How much is it?', 'What’s the rate?'] } },
  { id: 'counter', family: 'price', icon: '⇄', needsNumber: true, unit: 'rupees', label: L('Counter-offer', 'अपना दाम', 'आपला भाव', 'পাল্টা দাম', 'સામો ભાવ'),
    mean: { en: 'Could you please give it for ₹{n}?', hi: 'क्या आप इसे ₹{n} में दे सकते हैं?', mr: 'तुम्ही हे ₹{n} ला द्याल का?', gu: 'શું તમે આ ₹{n}માં આપશો?', bn: 'আপনি কি এটা ₹{n}-এ দেবেন?' }, w: {
    hi: ['भाई साहब, थोड़ा कम करके ₹{n} में दे दीजिए?', 'भैया, ₹{n} में दे दो?', 'अरे भैया, ₹{n} लगा लो!'],
    mr: ['दादा, थोडं कमी करून ₹{n} ला द्याल का?', 'दादा, ₹{n} ला द्या ना?', 'अरे दादा, ₹{n} लावा!'],
    gu: ['ભાઈ, થોડું ઓછું કરીને ₹{n}માં આપશો?', 'ભાઈ, ₹{n}માં આપો ને?', 'અરે ભાઈ, ₹{n} લગાવો!'],
    bn: ['দাদা, একটু কমিয়ে ₹{n}-এ দেবেন কি?', 'দাদা, ₹{n}-এ দিন তো?', 'আরে দাদা, ₹{n} ধরো!'],
    en: ['Sir, could you please bring it down to ₹{n}?', 'Can you do ₹{n}?', 'Hey, make it ₹{n}!'] } },
  { id: 'final', family: 'price', icon: '🚩', needsNumber: true, unit: 'rupees', label: L('Final offer', 'आख़िरी दाम', 'शेवटचा भाव', 'শেষ দাম', 'છેલ્લો ભાવ'),
    mean: { en: 'My final price is ₹{n}.', hi: 'मेरा आख़िरी दाम ₹{n} है।', mr: 'माझा शेवटचा भाव ₹{n} आहे.', gu: 'મારો છેલ્લો ભાવ ₹{n} છે.' }, w: {
    hi: ['भाई साहब, माफ़ कीजिए, मेरा आख़िरी दाम ₹{n} है।', 'भैया, मेरा आख़िरी दाम ₹{n} है।', 'भैया, बस ₹{n}, इससे ज़्यादा नहीं!'],
    mr: ['दादा, माफ करा, माझा शेवटचा भाव ₹{n} आहे.', 'दादा, माझा शेवटचा भाव ₹{n}.', 'दादा, फक्त ₹{n}, यापेक्षा जास्त नाही!'],
    gu: ['ભાઈ, માફ કરજો, મારો છેલ્લો ભાવ ₹{n} છે.', 'ભાઈ, મારો છેલ્લો ભાવ ₹{n} છે.', 'ભાઈ, બસ ₹{n}, આનાથી વધારે નહીં!'],
    bn: ['দাদা, কিছু মনে করবেন না, আমার শেষ দাম ₹{n}।', 'দাদা, আমার শেষ দাম ₹{n}।', 'দাদা, শুধু ₹{n}, এর বেশি না!'],
    en: ['Sir, I am sorry, my final price is ₹{n}.', 'My final price is ₹{n}.', 'Just ₹{n}, no more!'] } },
  { id: 'tooexp', family: 'price', icon: '⬆️', label: L('Too expensive', 'बहुत महँगा', 'खूप महाग', 'অনেক দামি', 'બહુ મોંઘું'),
    mean: { en: 'This is a bit too much for me.', hi: 'यह मेरे लिए थोड़ा ज़्यादा है।', mr: 'हे माझ्यासाठी थोडं जास्त आहे.', gu: 'આ મારા માટે થોડું વધારે છે.' }, w: {
    hi: ['भाई साहब, यह मेरे लिए थोड़ा ज़्यादा है।', 'भैया, यह ज़्यादा लग रहा है।', 'अरे भैया, बहुत महँगा है!'],
    mr: ['दादा, माफ करा, हे माझ्यासाठी थोडं जास्त आहे.', 'दादा, हे जास्त वाटतंय.', 'अरे दादा, खूप महाग आहे!'],
    gu: ['ભાઈ, માફ કરજો, આ મારા માટે થોડું વધારે છે.', 'ભાઈ, આ વધારે લાગે છે.', 'અરે ભાઈ, બહુ મોંઘું છે!'],
    bn: ['দাদা, কিছু মনে করবেন না, এটা আমার কাছে একটু বেশি।', 'দাদা, এটা বেশি মনে হচ্ছে।', 'আরে দাদা, অনেক দাম!'],
    en: ['Sir, this is a little too much for me.', 'This seems too much.', 'Hey, that’s very expensive!'] } },
  { id: 'accept', family: 'price', icon: '✅', label: L('Accept', 'मंज़ूर', 'मान्य', 'রাজি', 'મંજૂર'),
    mean: { en: 'Okay, I agree. Thank you.', hi: 'ठीक है, मंज़ूर है। धन्यवाद।', mr: 'ठीक आहे, मान्य आहे. धन्यवाद.', gu: 'સારું, મંજૂર છે. આભાર.' }, w: {
    hi: ['ठीक है भाई साहब, मंज़ूर है, धन्यवाद।', 'ठीक है भैया, मंज़ूर।', 'चलो भैया, पक्का!'],
    mr: ['ठीक आहे दादा, मान्य आहे, तुमचे आभार.', 'ठीक आहे दादा, मान्य.', 'चला दादा, पक्कं!'],
    gu: ['સારું ભાઈ, મંજૂર છે, આપનો આભાર.', 'સારું ભાઈ, મંજૂર.', 'ચાલો ભાઈ, પાક્કું!'],
    bn: ['ঠিক আছে দাদা, রাজি, আপনাকে ধন্যবাদ।', 'ঠিক আছে দাদা, রাজি।', 'চলো দাদা, পাকা!'],
    en: ['All right sir, agreed, thank you.', 'Okay, agreed.', 'Deal!'] } },
  { id: 'refuse', family: 'price', icon: '✋', label: L('Not this time', 'इस बार नहीं', 'या वेळी नाही', 'এবার না', 'આ વખતે નહીં'), w: {
    hi: ['माफ़ कीजिए भाई साहब, इस बार रहने दीजिए।', 'भैया, रहने दो, अभी नहीं।', 'नहीं भैया, छोड़ो।'],
    mr: ['माफ करा दादा, या वेळी राहू द्या.', 'दादा, राहू द्या, आत्ता नको.', 'नको दादा, सोडा.'],
    gu: ['માફ કરજો ભાઈ, આ વખતે રહેવા દો.', 'ભાઈ, રહેવા દો, હમણાં નહીં.', 'ના ભાઈ, છોડો.'],
    bn: ['কিছু মনে করবেন না দাদা, এবার থাক।', 'দাদা, থাক, এখন না।', 'না দাদা, ছাড়ো।'],
    en: ['Sorry sir, let us leave it this time.', 'Leave it, not now.', 'Nah, forget it.'] } },
  // ── pay
  { id: 'upi', family: 'pay', icon: '📱', label: L('Pay by UPI?', 'UPI से दूँ?', 'UPI ने देऊ?', 'UPI-তে দেব?', 'UPI થી આપું?'), w: {
    hi: ['भाई साहब, क्या UPI से भुगतान हो सकता है?', 'भैया, UPI चलेगा?', 'भैया, UPI ले लोगे?'],
    mr: ['दादा, UPI ने पैसे दिले तर आपल्याला चालेल का?', 'दादा, UPI चालेल का?', 'दादा, UPI घ्याल?'],
    gu: ['ભાઈ, UPI થી ચૂકવણી થઈ શકશે?', 'ભાઈ, UPI ચાલશે?', 'ભાઈ, UPI લેશો?'],
    bn: ['দাদা, UPI-তে দিলে আপনার চলবে কি?', 'দাদা, UPI চলবে?', 'দাদা, UPI নেবে?'],
    en: ['Sir, may I pay by UPI?', 'Is UPI okay?', 'UPI fine?'] } },
  { id: 'cash', family: 'pay', icon: '💵', label: L('Pay cash', 'नकद दूँ', 'रोख देते', 'নগদ দেব', 'રોકડા આપું'), w: {
    hi: ['भाई साहब, मैं नकद दे देती हूँ।', 'भैया, नकद लो।', 'भैया, ये लो कैश!'],
    mr: ['दादा, आपल्याला रोख देते.', 'दादा, रोख घ्या.', 'दादा, हे घ्या कॅश!'],
    gu: ['ભાઈ, આપને રોકડા આપું છું.', 'ભાઈ, રોકડા લો.', 'ભાઈ, લો કૅશ!'],
    en: ['Sir, I will pay in cash.', 'Here is cash.', 'Cash, here!'] } },
  { id: 'change', family: 'pay', icon: '🪙', label: L('Do you have change?', 'छुट्टे हैं?', 'सुटे आहेत का?', 'খুচরো আছে?', 'છૂટા છે?'), w: {
    hi: ['भाई साहब, क्या आपके पास छुट्टे होंगे?', 'भैया, छुट्टे हैं?', 'भैया, छुट्टा है?'],
    mr: ['दादा, तुमच्याकडे सुटे पैसे असतील का?', 'दादा, सुटे आहेत का?', 'दादा, सुटे हायत?'],
    gu: ['ભાઈ, આપની પાસે છૂટા હશે?', 'ભાઈ, છૂટા છે?', 'ભાઈ, છૂટા છે કે?'],
    en: ['Sir, would you have change?', 'Do you have change?', 'Got change?'] } },
  // ── delivery
  { id: 'deliver', family: 'delivery', icon: '🏠', label: L('Can you deliver?', 'घर पहुँचा देंगे?', 'घरपोच द्याल का?', 'বাড়িতে দেবেন?', 'ઘરે પહોંચાડશો?'), w: {
    hi: ['भाई साहब, क्या आप इसे घर पहुँचा देंगे?', 'भैया, घर पहुँचा दोगे?', 'भैया, घर भिजवा दो!'],
    mr: ['दादा, हे घरपोच द्याल का?', 'दादा, घरी पोचवाल का?', 'दादा, घरी पाठवा!'],
    gu: ['ભાઈ, આ ઘરે પહોંચાડી આપશો?', 'ભાઈ, ઘરે પહોંચાડશો?', 'ભાઈ, ઘરે મોકલી દો!'],
    en: ['Sir, could you deliver this home?', 'Can you deliver?', 'Send it home!'] } },
  { id: 'when', family: 'delivery', icon: '🕒', label: L('When will it come?', 'कब आएगा?', 'कधी येईल?', 'কখন আসবে?', 'ક્યારે આવશે?'), w: {
    hi: ['भाई साहब, यह कब तक पहुँचेगा?', 'भैया, कब आएगा?', 'भैया, कब तक?'],
    mr: ['दादा, हे कधीपर्यंत पोचेल, सांगाल का?', 'दादा, कधी येईल?', 'दादा, कधी?'],
    gu: ['ભાઈ, આ ક્યાં સુધીમાં પહોંચશે, કહેશો?', 'ભાઈ, ક્યારે આવશે?', 'ભાઈ, ક્યારે?'],
    en: ['Sir, when will it arrive?', 'When will it come?', 'When?'] } },
  // ── complaint
  { id: 'weightshort', family: 'complaint', icon: '⚖️', label: L('Weight seems short', 'तौल कम लगती है', 'वजन कमी वाटते', 'ওজন কম লাগছে', 'વજન ઓછું લાગે છે'), w: {
    hi: ['भाई साहब, शायद तौल थोड़ी कम है, एक बार फिर देख लीजिए?', 'भैया, तौल कम लग रही है।', 'भैया, तौल कम है!'],
    mr: ['दादा, कदाचित वजन थोडं कमी आहे, एकदा पुन्हा बघाल का?', 'दादा, वजन कमी वाटतंय.', 'दादा, वजन कमी आहे!'],
    gu: ['ભાઈ, કદાચ વજન થોડું ઓછું છે, એકવાર ફરી જોશો?', 'ભાઈ, વજન ઓછું લાગે છે.', 'ભાઈ, વજન ઓછું છે!'],
    en: ['Sir, perhaps the weight is a little short – could you check once more?', 'The weight seems short.', 'Weight’s short!'] } },
  { id: 'wrongitem', family: 'complaint', icon: '🔄', label: L('Wrong item', 'गलत सामान', 'चुकीचा माल', 'ভুল জিনিস', 'ખોટો માલ'), w: {
    hi: ['भाई साहब, शायद गलती से दूसरा सामान आ गया है।', 'भैया, यह वह सामान नहीं है।', 'भैया, ये गलत है!'],
    mr: ['दादा, माफ करा, कदाचित चुकून दुसरा माल आलाय.', 'दादा, हा तो माल नाही.', 'दादा, हे चुकीचं आहे!'],
    gu: ['ભાઈ, માફ કરજો, કદાચ ભૂલથી બીજો માલ આવી ગયો છે.', 'ભાઈ, આ એ માલ નથી.', 'ભાઈ, આ ખોટું છે!'],
    en: ['Sir, I think a different item came by mistake.', 'This is not the item.', 'Wrong one!'] } },
  // ── repair
  { id: 'slow', family: 'repair', icon: '🐢', label: L('Speak slowly', 'धीरे बोलें', 'हळू बोला', 'ধীরে বলুন', 'ધીમે બોલો'), w: {
    hi: ['भाई साहब, कृपया थोड़ा धीरे बोलिए।', 'भैया, थोड़ा धीरे बोलो।', 'भैया, धीरे!'],
    mr: ['दादा, कृपया थोडं हळू बोलाल का?', 'दादा, थोडं हळू बोला.', 'दादा, हळू!'],
    gu: ['ભાઈ, મહેરબાની કરીને થોડું ધીમે બોલશો?', 'ભાઈ, થોડું ધીમે બોલો.', 'ભાઈ, ધીમે!'],
    bn: ['দাদা, দয়া করে একটু ধীরে বলবেন?', 'দাদা, একটু ধীরে বলুন।', 'দাদা, আস্তে!'],
    en: ['Sir, could you please speak a little slowly?', 'Please speak slowly.', 'Slower!'] } },
  { id: 'again', family: 'repair', icon: '↺', label: L('Say it again, shorter', 'छोटे में फिर कहें', 'थोडक्यात पुन्हा सांगा', 'ছোট করে আবার বলুন', 'ટૂંકમાં ફરી કહો'), w: {
    hi: ['भाई साहब, कृपया छोटे में फिर से बताइए।', 'भैया, छोटे में फिर बोलो।', 'भैया, सीधा बोलो!'],
    mr: ['दादा, कृपया थोडक्यात पुन्हा सांगाल का?', 'दादा, थोडक्यात पुन्हा सांगा.', 'दादा, सरळ सांगा!'],
    gu: ['ભાઈ, મહેરબાની કરીને ટૂંકમાં ફરી કહેશો?', 'ભાઈ, ટૂંકમાં ફરી કહો.', 'ભાઈ, સીધું કહો!'],
    bn: ['দাদা, দয়া করে ছোট করে আবার বলবেন?', 'দাদা, ছোট করে আবার বলুন।', 'দাদা, সোজা বলো!'],
    en: ['Sir, could you say that again, more briefly?', 'Say it again, shorter.', 'Just the short version!'] } },
  { id: 'shownum', family: 'repair', icon: '🔢', label: L('Show the number', 'संख्या दिखाएँ', 'आकडा दाखवा', 'সংখ্যাটা দেখান', 'આંકડો બતાવો'), w: {
    hi: ['भाई साहब, कृपया दाम स्क्रीन पर अंकों में दिखा दीजिए।', 'भैया, दाम स्क्रीन पर दिखाओ।', 'भैया, नंबर दबाओ!'],
    mr: ['दादा, कृपया भाव स्क्रीनवर आकड्यांत दाखवाल का?', 'दादा, भाव स्क्रीनवर दाखवा.', 'दादा, आकडा दाबा!'],
    gu: ['ભાઈ, મહેરબાની કરીને ભાવ સ્ક્રીન પર આંકડામાં બતાવશો?', 'ભાઈ, ભાવ સ્ક્રીન પર બતાવો.', 'ભાઈ, આંકડો દબાવો!'],
    bn: ['দাদা, দয়া করে দামটা স্ক্রিনে সংখ্যায় দেখাবেন?', 'দাদা, দামটা স্ক্রিনে দেখান।', 'দাদা, নম্বর টেপো!'],
    en: ['Sir, could you please show the price as a number on the screen?', 'Show the price on the screen.', 'Tap the number!'] } },
];

export const ACT: Record<string, Act> = Object.fromEntries(ACTS.map((a) => [a.id, a]));
export const actsOf = (familyId: string) => ACTS.filter((a) => a.family === familyId);

// ─────────────────────────────────────────────────────────────────────────────
// Fragment frames (Assignment 1 §7.3). A counter-offer is assembled from
// register-labelled fragments [ADDRESS] [SOFTENER] [PRICE] [HEDGE]. Softeners come
// from firmer pools on each successive counter-offer, and no fragment repeats
// within a conversation while an unused one is left.
// ─────────────────────────────────────────────────────────────────────────────
type Pools = { address: string[]; soft: [string[], string[], string[]]; price: string; hedge: string[] };
type FrameSet = Partial<Record<Lang, Record<Register, Pools>>>;

export const COUNTER_FRAMES: FrameSet = {
  hi: {
    respectful: { address: ['भाई साहब,', 'भैया जी,'], soft: [['थोड़ा कम कर दीजिए,', 'अगर हो सके तो थोड़ा कम कीजिए,'], ['सच में बजट थोड़ा कम है,', 'हम आपके रोज़ के ग्राहक बनेंगे,'], ['इससे ज़्यादा सच में नहीं हो पाएगा,']], price: '₹{n} में दे दीजिए', hedge: ['?', ', ठीक रहेगा?', ', बड़ी मेहरबानी होगी।'] },
    neutral: { address: ['भैया,'], soft: [['थोड़ा कम करो,'], ['थोड़ा और कम करो,'], ['अब इससे ज़्यादा नहीं,']], price: '₹{n} में दे दो', hedge: ['?', '।'] },
    familiar: { address: ['अरे भैया,', 'भैया,'], soft: [['चलो,'], ['अरे यार,'], ['बस,']], price: '₹{n} लगा लो', hedge: ['!', ', पक्का!'] },
  },
  mr: {
    respectful: { address: ['दादा,', 'काका,'], soft: [['थोडं कमी कराल का,', 'जमलं तर थोडं कमी करा,'], ['खरंच बजेट थोडं कमी आहे,', 'आम्ही नेहमी तुमच्याकडेच येऊ,'], ['यापेक्षा जास्त खरंच जमणार नाही,']], price: '₹{n} ला द्याल का', hedge: ['?', ', बरं होईल.'] },
    neutral: { address: ['दादा,'], soft: [['थोडं कमी करा,'], ['अजून थोडं कमी करा,'], ['यापेक्षा जास्त नाही,']], price: '₹{n} ला द्या', hedge: ['.', ' ना?'] },
    familiar: { address: ['अरे दादा,'], soft: [['चला,'], ['अरे,'], ['बस,']], price: '₹{n} लावा', hedge: ['!'] },
  },
  gu: {
    respectful: { address: ['ભાઈ,', 'કાકા,'], soft: [['થોડું ઓછું કરશો,', 'બની શકે તો થોડું ઓછું કરો,'], ['સાચે બજેટ થોડું ઓછું છે,', 'અમે રોજ આપની પાસે જ આવીશું,'], ['આનાથી વધારે સાચે નહીં થાય,']], price: '₹{n}માં આપશો', hedge: ['?', ', મહેરબાની.'] },
    neutral: { address: ['ભાઈ,'], soft: [['થોડું ઓછું કરો,'], ['હજી થોડું ઓછું કરો,'], ['આનાથી વધારે નહીં,']], price: '₹{n}માં આપો', hedge: ['.', ' ને?'] },
    familiar: { address: ['અરે ભાઈ,'], soft: [['ચાલો,'], ['અરે,'], ['બસ,']], price: '₹{n} લગાવો', hedge: ['!'] },
  },
  en: {
    respectful: { address: ['Sir,', 'Brother,'], soft: [['could you bring it down a little –', 'if possible, a little less –'], ['my budget is really tight –', 'I will come back every week –'], ['honestly I cannot go higher –']], price: 'would ₹{n} be all right', hedge: ['?', ', please?'] },
    neutral: { address: [''], soft: [['a little less –'], ['a bit lower –'], ['no higher than this –']], price: 'can you do ₹{n}', hedge: ['?'] },
    familiar: { address: ['Hey,'], soft: [['come on,'], ['come on now,'], ['that’s it,']], price: 'make it ₹{n}', hedge: ['!'] },
  },
};

export type Slot = 'address' | 'softener' | 'price' | 'hedge' | 'act';
export interface Chip { slot: Slot; text: string; reg: Register }
export interface Phrase { text: string; lang: Lang; sample: boolean; chips: Chip[] }

const fill = (s: string, n: number | null) => s.split('{n}').join(n == null ? '…' : String(n));

/**
 * Builds what the phone will say. `used` holds fragments already spoken in this
 * conversation; `round` counts earlier counter-offers (0 = first) to pick firmer pools.
 */
export function buildPhrase(actId: string, target: Lang, reg: Register, n: number | null, used: Set<string> = new Set(), round = 0): Phrase {
  const act = ACT[actId];
  const frames = actId === 'counter' ? COUNTER_FRAMES[target]?.[reg] : undefined;
  if (frames) {
    const pick = (pool: string[]) => pool.find((x) => !used.has(x)) ?? pool[round % pool.length];
    const a = pick(frames.address);
    const s = pick(frames.soft[Math.min(round, 2)]);
    const p = fill(frames.price, n);
    const h = pick(frames.hedge);
    const text = [a, s, p].filter(Boolean).join(' ') + h;
    const chips: Chip[] = [
      ...(a ? [{ slot: 'address' as Slot, text: a, reg }] : []),
      { slot: 'softener', text: s, reg },
      { slot: 'price', text: p, reg },
      { slot: 'hedge', text: h, reg },
    ];
    return { text, lang: target, sample: false, chips };
  }
  const wording = act.w[target] ?? act.w.en!;
  const lang: Lang = act.w[target] ? target : 'en';
  const text = fill(wording[REG_I[reg]], n);
  const chips: Chip[] = [];
  const comma = text.search(/[,،]\s/);
  if (comma > 0 && comma < 22) {
    chips.push({ slot: 'address', text: text.slice(0, comma), reg });
    chips.push({ slot: 'act', text: text.slice(comma + 2), reg });
  } else chips.push({ slot: 'act', text, reg });
  return { text, lang, sample: !act.w[target], chips };
}

export function meaningOf(actId: string, ui: Lang, n: number | null): string {
  const act = ACT[actId];
  return fill(act.mean?.[ui] ?? act.mean?.en ?? act.label[ui], n);
}

/** What the seller's quote sounds like to the buyer (authored, per buyer language). */
export const SELLER_QUOTE: Record<Lang, string> = {
  en: 'I can give it for ₹{n}.',
  hi: 'मैं ₹{n} में दे सकता हूँ।',
  mr: 'मी ₹{n} ला देऊ शकतो.',
  gu: 'હું ₹{n}માં આપી શકું.',
  bn: 'আমি ₹{n}-এ দিতে পারি।',
};
export const SELLER_AGREE: Record<Lang, string> = {
  en: 'Okay, agreed.', hi: 'ठीक है, मंज़ूर।', mr: 'ठीक आहे, मान्य.', gu: 'સારું, મંજૂર.', bn: 'ঠিক আছে, রাজি।',
};
export const sellerQuote = (lang: Lang, n: number) => SELLER_QUOTE[lang].split('{n}').join(String(n));

/** Pack sizes from the reports (MB per language pair). */
export const PACK_MB = { A: 118, B: 260 } as const;
