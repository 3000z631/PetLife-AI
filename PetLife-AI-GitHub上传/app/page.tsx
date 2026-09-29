"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type RiskLevel = "观察" | "尽快就医" | "立即急诊";
type HealthResult = { level: RiskLevel; title: string; direction: string; actions: string[]; watch: string[] };
type PetAnalysis = { is_cat: boolean; breed: string; breed_confidence: number; age_min_months: number; age_max_months: number; bcs_min: number; bcs_max: number; visible_features: string[]; limitations: string[] };
type TriageAnalysis = { risk_level: RiskLevel; title: string; summary: string; possible_directions: string[]; actions: string[]; red_flags: string[]; prohibited_actions: string[] };
type Product = { id: string; name: string; category: string; price: number; reason: string; caution: string; keyword: string; priority: "必需" | "建议" | "可选" };
type FoodMode = "干粮+湿粮" | "纯干粮" | "纯湿粮" | "自定义搭配";
type FoodEntry = { id: number; name: string; energy: number; amount: number };
type Observation = { id: number; title: string; date: string; level: RiskLevel; status: "观察中" | "好转" | "差不多" | "加重" };

const products: Product[] = [
  { id:"kitten-food", name:"幼猫成长全价主粮", category:"幼猫主粮", price:179, reason:"适配 12 月龄以下快速生长期，提供更高营养密度与成长支持", caution:"按当前体重分餐喂养，换粮建议用 7 天逐步过渡", keyword:"幼猫 全价主粮", priority:"必需" },
  { id:"adult-food", name:"成猫日常全价主粮", category:"成猫主粮", price:169, reason:"适配 1—7 岁成猫的日常维持需求，并结合绝育和活动量控制热量", caution:"根据体态与体重趋势调整份量", keyword:"成猫 全价主粮", priority:"必需" },
  { id:"senior-food", name:"老年猫易消化全价主粮", category:"老年猫主粮", price:199, reason:"适配 7 岁以上老年阶段，侧重易进食、体重与肌肉状态管理", caution:"食欲、饮水或体重明显变化时应先就医", keyword:"老年猫 全价主粮", priority:"必需" },
  { id:"wet-food", name:"高含水主食湿粮组合", category:"主食湿粮", price:129, reason:"增加每日水分摄入，并可按热量方案替换部分干粮", caution:"开封后冷藏并尽快食用", keyword:"猫 主食罐 湿粮", priority:"建议" },
  { id:"fountain", name:"静音循环饮水机", category:"饮水设备", price:199, reason:"提供流动饮水，适合需要提高饮水机会的猫咪", caution:"定期清洗水泵并按周期更换滤芯", keyword:"猫 静音 饮水机", priority:"建议" },
  { id:"slow-bowl", name:"慢食与益智取食器", category:"行为用品", price:69, reason:"延长进食时间，并通过取食活动增加日常消耗", caution:"首次使用应陪同观察，避免挫败或啃咬碎片", keyword:"猫 慢食 益智 喂食器", priority:"可选" },
  { id:"brush", name:"长毛猫梳理护理套装", category:"毛发护理", price:89, reason:"根据长毛品种特征增加梳理频率，减少浮毛堆积", caution:"皮肤红肿、破溃或明显疼痛时停止使用", keyword:"长毛猫 梳毛 护理", priority:"建议" },
  { id:"scale", name:"宠物体重监测秤", category:"健康监测", price:239, reason:"跟踪体重趋势，帮助调整喂食量并识别异常变化", caution:"短期明显消瘦或增重应联系兽医", keyword:"宠物 猫 体重秤", priority:"可选" },
  { id:"joint", name:"低层猫阶与防滑垫", category:"行动支持", price:189, reason:"老年期或行动不适时减少跳跃高度与打滑风险", caution:"跛行、疼痛或不愿活动时应先就医", keyword:"老年猫 防滑垫 猫阶", priority:"建议" },
  { id:"gut", name:"温和肠胃护理主食", category:"营养管理", price:219, reason:"为肠胃敏感场景提供易消化的主食筛选方向", caution:"持续腹泻、便血、频繁呕吐或精神差时应先就医", keyword:"猫 肠胃敏感 主食", priority:"建议" },
  { id:"skin", name:"低敏清洁与皮肤护理套装", category:"皮肤护理", price:119, reason:"减少不必要的香精刺激，并帮助保持局部清洁", caution:"大面积脱毛、渗液、破溃或明显瘙痒需就医检查", keyword:"猫 低敏 皮肤护理", priority:"建议" },
  { id:"urinary", name:"泌尿健康高含水主食包", category:"泌尿与饮水", price:229, reason:"通过高含水主食增加水分摄入，支持泌尿系统日常管理", caution:"频繁蹲猫砂盆、尿血或无法排尿时应立即就医", keyword:"猫 泌尿健康 湿粮", priority:"建议" },
  { id:"weight", name:"体重管理控能量主食", category:"体重管理", price:209, reason:"结合目标热量提供更明确的定量喂养选择", caution:"不建议突然大幅减量；异常消瘦需就医排查", keyword:"猫 体重管理 主粮", priority:"建议" },
  { id:"daily-care", name:"日常清洁护理补给包", category:"日常养护", price:99, reason:"覆盖食具清洁、指甲与基础居家护理需求", caution:"根据实际使用频率选购，避免重复囤积", keyword:"猫 日常护理 用品", priority:"可选" },
  { id:"renal", name:"肾脏营养处方粮", category:"遵医嘱商品", price:329, reason:"仅用于已确诊且获得兽医饮食建议的肾脏疾病管理", caution:"处方粮必须遵医嘱购买，不能替代治疗或药物", keyword:"猫 肾脏 处方粮", priority:"必需" },
];

const breeds = [
  "中华田园猫", "英国短毛猫", "英国长毛猫", "美国短毛猫", "布偶猫", "暹罗猫", "缅因猫",
  "波斯猫", "异国短毛猫", "金吉拉", "苏格兰折耳猫", "苏格兰立耳猫", "挪威森林猫", "西伯利亚猫",
  "孟加拉豹猫", "阿比西尼亚猫", "缅甸猫", "伯曼猫", "俄罗斯蓝猫", "斯芬克斯猫", "德文卷毛猫",
  "柯尼斯卷毛猫", "塞尔凯克卷毛猫", "东方短毛猫", "土耳其安哥拉猫", "土耳其梵猫", "埃及猫",
  "索马里猫", "曼岛猫", "曼基康猫", "混种猫", "其他 / 不确定",
];
const breedNotes: Record<string, { focus: string; tips: string[] }> = {
  "英国短毛猫": { focus: "体重管理", tips: ["体型敦实，建议每周称重并记录体态变化", "使用漏食玩具延长进食时间，减少无聊进食"] },
  "英国长毛猫": { focus: "体重与毛发", tips: ["长毛会遮盖体态变化，应结合触摸肋骨评估", "规律梳毛并通过湿粮增加饮水机会"] },
  "美国短毛猫": { focus: "活动与体重", tips: ["保留每日追逐、攀爬等短时高强度活动", "绝育后按热量定量，不建议全天自由采食"] },
  "布偶猫": { focus: "大型体态与毛发", tips: ["结合体态而非只按体重判断喂食量", "规律梳毛，并记录毛球和呕吐频次"] },
  "暹罗猫": { focus: "活力与肌肉", tips: ["通过益智取食和互动游戏满足较高活动需求", "关注肌肉状态，避免只看秤面数字"] },
  "中华田园猫": { focus: "均衡与适应", tips: ["优先选择符合当前生命阶段的全价主食", "食物切换用 7 天左右逐步过渡并观察粪便"] },
  "缅因猫": { focus: "大型体型与关节", tips: ["幼年期避免追求过快增重，定期评估体态", "保持规律低冲击活动，出现跛行及时就医"] },
  "波斯猫": { focus: "长毛与进食体验", tips: ["每日梳毛并观察毛球相关表现", "可尝试浅口宽碗，并保持面部和食具清洁"] },
  "异国短毛猫": { focus: "体重与进食体验", tips: ["定量喂食并持续跟踪体态", "使用浅口宽碗，进食异常时及时就医"] },
  "金吉拉": { focus: "毛发与体态", tips: ["长毛可能遮盖体态变化，定期触摸评估肋骨", "规律梳毛并提高饮水机会"] },
  "苏格兰折耳猫": { focus: "体态与行动观察", tips: ["避免超重增加关节负担", "若出现僵硬、跛行或不愿跳跃，应尽快就医"] },
  "苏格兰立耳猫": { focus: "均衡与体态", tips: ["根据绝育和活动状态定量喂食", "每 2–4 周复查体重和体态"] },
  "挪威森林猫": { focus: "大型体态与毛发", tips: ["成长阶段避免过度喂养", "换毛期增加梳理并观察毛球情况"] },
  "西伯利亚猫": { focus: "活动与毛发", tips: ["提供攀爬和互动游戏", "长毛需规律梳理，喂食量按体态调整"] },
  "孟加拉豹猫": { focus: "高活动需求", tips: ["采用益智取食并安排多次互动活动", "活动量变化时同步调整每日热量"] },
  "阿比西尼亚猫": { focus: "活力与肌肉", tips: ["提供攀爬、探索与互动取食", "关注肌肉保持和体重趋势"] },
  "俄罗斯蓝猫": { focus: "体重与规律", tips: ["保持固定餐次并控制零食热量", "用游戏维持日常活动量"] },
  "斯芬克斯猫": { focus: "能量与皮肤观察", tips: ["无毛猫能量需求可能有个体差异，应按体重趋势调整", "保持皮肤和食具清洁，不自行使用护肤品"] },
  "德文卷毛猫": { focus: "活力与体态", tips: ["活跃个体可分成多餐并结合益智取食", "按体态趋势调整，不因食欲旺盛而过量喂食"] },
  "曼基康猫": { focus: "体重与低冲击活动", tips: ["避免超重增加行动负担", "提供容易到达的低层活动设施"] },
  "混种猫": { focus: "个体状态", tips: ["以体态、活动量和健康史为主要依据", "每 2–4 周复查体重并微调喂食量"] },
  "其他 / 不确定": { focus: "个体状态", tips: ["品种只是参考，体态、活动量和健康史更重要", "每 2–4 周复查体重，并据变化微调喂食量"] },
};

function readImage(event: ChangeEvent<HTMLInputElement>, done: (url: string) => void) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => done(String(reader.result));
  reader.readAsDataURL(file);
}

function classifySymptoms(text: string): HealthResult {
  const value = text.trim();
  const emergency = ["呼吸困难", "张口呼吸", "喘不上气", "无法排尿", "尿不出来", "抽搐", "昏迷", "中毒", "大量出血", "高处坠落"];
  const urgent = ["反复呕吐", "连续呕吐", "不吃", "拒食", "便血", "尿血", "眼睛睁不开", "精神很差", "跛行", "腹泻"];
  if (emergency.some((keyword) => value.includes(keyword))) {
    return {
      level: "立即急诊", title: "发现可能危及生命的信号", direction: "可能涉及呼吸、泌尿阻塞、神经或严重外伤等急症，网页无法安全排除风险。",
      actions: ["现在联系最近的 24 小时宠物急诊并准备出发", "保持猫咪安静、保暖并减少搬动；使用通风猫包运输", "带上可疑毒物包装、用药信息和症状发生时间"],
      watch: ["不要等待网页给出确诊", "不要自行喂人用药或强行灌食、灌水"],
    };
  }
  if (urgent.some((keyword) => value.includes(keyword))) {
    return {
      level: "尽快就医", title: "建议今天联系宠物医院", direction: "描述中有持续消化道、食欲、泌尿、眼部或疼痛相关异常，需要兽医结合体检判断。",
      actions: ["记录症状开始时间、频率以及最近一次进食和排泄", "保存清晰照片或短视频，预约当日门诊", "提供干净饮水并保持熟悉环境，不自行加药"],
      watch: ["若出现呼吸困难、无法排尿、昏沉或抽搐，立即转急诊", "幼猫、老年猫或有慢性病时应更早就医"],
    };
  }
  return {
    level: "观察", title: "暂未匹配到明确急症信号", direction: value ? "目前只能做初步风险分级，轻微皮肤、喷嚏或偶发胃肠症状也可能有多种原因。" : "请补充症状、持续时间、食欲与排泄变化，结果会更有参考价值。",
    actions: ["拍照记录并观察精神、食欲、饮水和排泄变化", "保持环境清洁安静，不使用人用药", "若持续超过 24 小时、加重或反复出现，预约兽医检查"],
    watch: ["任何呼吸异常、无法排尿、抽搐或意识异常都应立即急诊", "本结果不构成诊断或处方"],
  };
}

function matchBreed(value: string) {
  if (/英国短毛|英短/.test(value)) return "英国短毛猫";
  if (/英国长毛|英长/.test(value)) return "英国长毛猫";
  if (/美国短毛|美短/.test(value)) return "美国短毛猫";
  if (/布偶|Ragdoll/i.test(value)) return "布偶猫";
  if (/暹罗|Siamese/i.test(value)) return "暹罗猫";
  if (/缅因|Maine Coon/i.test(value)) return "缅因猫";
  if (/田园|家猫|混种/.test(value)) return "中华田园猫";
  const normalized = breeds.find((item) => value.includes(item.replace(/猫$/, "")));
  return normalized || value.trim() || "其他 / 不确定";
}

export default function Home() {
  const profileImageRef = useRef<HTMLInputElement>(null);
  const symptomImageRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"home" | "feeding" | "health" | "recommend">("home");
  const [profileImage, setProfileImage] = useState("");
  const [symptomImage, setSymptomImage] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState(false);
  const [recognitionMessage, setRecognitionMessage] = useState("");
  const [recognitionDetail, setRecognitionDetail] = useState("");
  const [name, setName] = useState("团子");
  const [breed, setBreed] = useState("英国短毛猫");
  const [age, setAge] = useState(2);
  const [weight, setWeight] = useState(4.6);
  const [sex, setSex] = useState("妹妹");
  const [neutered, setNeutered] = useState("已绝育");
  const [activity, setActivity] = useState("适中");
  const [bcs, setBcs] = useState(5);
  const [symptoms, setSymptoms] = useState("");
  const [healthResult, setHealthResult] = useState<HealthResult>();
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthNotice, setHealthNotice] = useState("");
  const [healthGoals, setHealthGoals] = useState<string[]>(["日常养护"]);
  const [cart, setCart] = useState<Product[]>([]);
  const [foodMode, setFoodMode] = useState<FoodMode>("干粮+湿粮");
  const [freezeDried, setFreezeDried] = useState(0);
  const [treatSticks, setTreatSticks] = useState(0);
  const [dailyStatus, setDailyStatus] = useState<{spirit:boolean|null; appetite:boolean|null; litter:boolean|null}>({ spirit:null, appetite:null, litter:null });
  const [tasks, setTasks] = useState([{ label:"晚餐湿粮", done:false },{ label:"梳毛 5 分钟", done:false },{ label:"陪玩 15 分钟", done:false },{ label:"清洗水碗", done:false }]);
  const [foodName, setFoodName] = useState("");
  const [foodEnergy, setFoodEnergy] = useState(0);
  const [foodAmount, setFoodAmount] = useState(0);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dietInfo, setDietInfo] = useState({ birthday:"", homeDate:"", meals:"3", picky:"否", allergy:"", disease:"", medicine:"", lifestyle:"纯室内", vaccine:"", deworm:"" });

  const ageMonths = Math.round(age * 12);
  const factor = age < 1 ? 2.5 : Math.max(.85, Math.min(1.6,
    (neutered === "已绝育" ? 1.2 : 1.45) + (activity === "活跃" ? .15 : activity === "较少" ? -.15 : 0) + (bcs > 6 ? -.15 : bcs < 4 ? .1 : 0)
  ));
  const calories = Math.max(80, Math.round(70 * Math.pow(Math.max(weight, .5), .75) * factor));
  const stagePlan = ageMonths < 4
    ? { stage:"离乳幼猫期", meals:"每天 4～5 餐", wetRatio:.65, dryRatio:.25, focus:"少量多餐，优先选择易咀嚼、符合幼猫阶段的全价主食" }
    : ageMonths < 7
      ? { stage:"快速生长期", meals:"每天 4 餐", wetRatio:.60, dryRatio:.30, focus:"保证成长所需营养密度，按体重变化及时调整份量" }
      : ageMonths < 12
        ? { stage:"幼猫后期", meals:"每天 3 餐", wetRatio:.55, dryRatio:.35, focus:"继续使用幼猫全价主食，避免因接近成年而过早换成成猫粮" }
        : ageMonths < 84
          ? { stage:"成年维持期", meals:"每天 2～3 餐", wetRatio:.55, dryRatio:.35, focus:"结合绝育、活动量和BCS控制总热量，维持理想体态" }
          : { stage:"老年照护期", meals:"每天 3～4 小餐", wetRatio:.65, dryRatio:.25, focus:"提高湿粮比例和进食便利性，重点观察体重、肌肉与食欲变化" };
  const wetGrams = Math.round(calories * stagePlan.wetRatio / .95);
  const dryGrams = Math.round(calories * stagePlan.dryRatio / 3.8);
  const note = breedNotes[breed] || breedNotes["其他 / 不确定"];
  const lifeStage = ageMonths < 12 ? "幼猫期" : ageMonths < 84 ? "成猫期" : "老年期";
  const breedFeeding = /布偶|缅因|挪威森林|西伯利亚/.test(breed)
    ? "大型品种：成长阶段避免追求过快增重，按体态而不是只按体重决定份量。"
    : /英国短毛|异国短毛|俄罗斯蓝|曼基康/.test(breed)
      ? "易体重管理品种：绝育后严格定量，优先分餐与益智取食，避免全天自由采食。"
      : /暹罗|孟加拉|阿比西尼亚|德文卷毛/.test(breed)
        ? "高活动品种：根据实际运动量调整热量，并通过互动游戏维持肌肉状态。"
        : /波斯|金吉拉|英国长毛/.test(breed)
          ? "长毛品种：提高湿粮和饮水机会，规律梳毛，并观察毛球和呕吐频率。"
          : "通用品种策略：以月龄、BCS、绝育状态和体重趋势为主，品种仅作为辅助修正。";
  const recommendedProducts = products.filter((product) => {
    if (product.id === "kitten-food") return ageMonths < 12;
    if (product.id === "adult-food") return ageMonths >= 12 && ageMonths < 84;
    if (product.id === "senior-food") return ageMonths >= 84;
    if (product.id === "renal") return healthGoals.includes("已确诊肾脏疾病");
    if (product.id === "joint") return healthGoals.includes("关节与行动") || ageMonths >= 84;
    if (product.id === "gut") return healthGoals.includes("肠胃敏感");
    if (product.id === "skin") return healthGoals.includes("皮肤与毛发");
    if (product.id === "urinary") return healthGoals.includes("泌尿与饮水");
    if (product.id === "weight") return healthGoals.includes("体重管理") || bcs >= 6;
    if (product.id === "daily-care") return healthGoals.includes("日常养护");
    if (product.id === "brush") return /长毛|布偶|缅因|波斯|金吉拉|森林|西伯利亚/.test(breed);
    if (product.id === "slow-bowl") return healthGoals.includes("体重管理") || bcs >= 6;
    if (product.id === "scale") return healthGoals.includes("体重管理") || ageMonths >= 84;
    if (product.id === "fountain" || product.id === "wet-food") return healthGoals.some((goal) => ["泌尿与饮水", "已确诊肾脏疾病", "日常养护"].includes(goal));
    return true;
  });
  const snackTarget = Math.round(calories * .1);
  const freezeDriedCalories = Math.round(freezeDried * 4.5);
  const stickCalories = treatSticks * 8;
  const snackUsed = freezeDriedCalories + stickCalories;
  const customCalories = Math.round(foods.reduce((sum, food) => sum + food.energy * food.amount / 100, 0));
  const plannedCalories = foodMode === "自定义搭配" ? customCalories + snackUsed : Math.round(calories * .9) + snackUsed;
  const dryPlan = foodMode === "纯干粮" ? Math.round(calories * .9 / 3.8) : foodMode === "纯湿粮" ? 0 : foodMode === "自定义搭配" ? 0 : dryGrams;
  const wetPlan = foodMode === "纯湿粮" ? Math.round(calories * .9 / .95) : foodMode === "纯干粮" ? 0 : foodMode === "自定义搭配" ? 0 : wetGrams;
  const remainingCalories = Math.max(0, calories - plannedCalories);
  const loggedCalories = customCalories + snackUsed;
  const splitPlan = (amount:number) => ageMonths < 7 ? `分4餐，每餐约 ${Math.round(amount/4)}g` : ageMonths < 12 ? `分3餐，每餐约 ${Math.round(amount/3)}g` : ageMonths >= 84 ? `分3～4小餐，每餐约 ${Math.round(amount/4)}g` : `早晚分餐，每餐约 ${Math.round(amount/2)}g`;
  const nextMeal = wetPlan ? `18:30 · 湿粮 ${Math.round(wetPlan / 2)}g` : `18:30 · 干粮 ${Math.round(dryPlan / 2)}g`;

  useEffect(() => {
    const saved = localStorage.getItem("petlife-daily-v3");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.tasks) setTasks(data.tasks);
      if (data.foods) setFoods(data.foods);
      if (data.observations) setObservations(data.observations);
      if (data.weightHistory) setWeightHistory(data.weightHistory);
      if (data.freezeDried != null) setFreezeDried(data.freezeDried);
      if (data.treatSticks != null) setTreatSticks(data.treatSticks);
      if (data.dailyStatus) setDailyStatus(data.dailyStatus);
      if (data.dietInfo) setDietInfo(data.dietInfo);
      if (data.healthGoals) setHealthGoals(data.healthGoals);
    } catch { /* ignore invalid local data */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("petlife-daily-v3", JSON.stringify({ tasks, foods, observations, weightHistory, freezeDried, treatSticks, dailyStatus, dietInfo, healthGoals }));
  }, [tasks, foods, observations, weightHistory, freezeDried, treatSticks, dailyStatus, dietInfo, healthGoals]);

  function toggleHealthGoal(goal: string) {
    setHealthGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]);
  }

  function selectProfileImage(event: ChangeEvent<HTMLInputElement>) {
    readImage(event, async (url) => {
      setProfileImage(url); setRecognizing(true); setRecognized(false); setRecognitionMessage("");
      try {
        const response = await fetch("/api/analyze-pet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: url }),
        });
        const result = await response.json() as PetAnalysis & { error?: string };
        if (!response.ok) throw new Error(result.error || "识别服务暂时不可用");
        if (!result.is_cat) throw new Error("图片中没有识别到猫咪，请换一张清晰照片");
        setBreed(matchBreed(result.breed));
        setAge(Number((((result.age_min_months + result.age_max_months) / 2) / 12).toFixed(1)));
        setBcs(Math.round((result.bcs_min + result.bcs_max) / 2));
        setRecognized(true);
        setRecognitionMessage(`可能是${result.breed}`);
        setRecognitionDetail(`置信度 ${Math.round(result.breed_confidence * 100)}% · 年龄约 ${result.age_min_months}–${result.age_max_months} 个月 · BCS ${result.bcs_min}–${result.bcs_max}/9`);
      } catch (error) {
        setRecognitionMessage(error instanceof Error ? error.message : "识别失败，请稍后重试");
        setRecognitionDetail("照片已保留，你仍可手动填写右侧资料");
      } finally {
        setRecognizing(false);
      }
    });
  }

  async function runHealthTriage() {
    const localResult = classifySymptoms(symptoms);
    setHealthNotice("");
    if (localResult.level === "立即急诊") {
      setHealthResult(localResult);
      setHealthNotice("已由本地急症规则直接拦截，无需等待模型判断");
      return;
    }
    setHealthLoading(true);
    try {
      const response = await fetch("/api/health-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: symptomImage || undefined, description: symptoms, profile: { breed, age, weight } }),
      });
      const result = await response.json() as TriageAnalysis & { error?: string };
      if (!response.ok) throw new Error(result.error || "模型分析暂时不可用");
      setHealthResult({
        level: result.risk_level,
        title: result.title,
        direction: `${result.summary}${result.possible_directions.length ? ` 需要兽医排查：${result.possible_directions.join("、")}。` : ""}`,
        actions: result.actions,
        watch: [...result.red_flags, ...result.prohibited_actions.map((item) => `禁止：${item}`)],
      });
      setHealthNotice("本次结果由多模态模型生成，并经过固定格式约束");
    } catch (error) {
      setHealthResult(localResult);
      setHealthNotice(`${error instanceof Error ? error.message : "模型服务不可用"}；已自动使用本地风险规则`);
    } finally {
      setHealthLoading(false);
    }
  }

  function goToFeeding() {
    setTab("feeding");
    window.setTimeout(() => document.getElementById("app")?.scrollIntoView({ behavior: "smooth" }), 20);
  }

  function goToRecommend() {
    setTab("recommend");
    window.setTimeout(() => document.getElementById("app")?.scrollIntoView({ behavior: "smooth" }), 20);
  }

  function goToHomeSection(id = "home-profile") {
    setTab("home");
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  }

  function addFood() {
    if (!foodName.trim() || foodEnergy <= 0 || foodAmount <= 0) return;
    setFoods((items) => [...items, { id:Date.now(), name:foodName.trim(), energy:foodEnergy, amount:foodAmount }]);
    setFoodName(""); setFoodEnergy(0); setFoodAmount(0);
  }

  function addObservation() {
    if (!healthResult) return;
    setObservations((items) => [{ id:Date.now(), title:symptoms.slice(0,22) || healthResult.title, date:new Date().toLocaleDateString("zh-CN"), level:healthResult.level, status:"观察中" }, ...items]);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="宠智伴首页"><span className="brandMark">P</span><span>宠智伴 <small>PetLife AI</small></span></a>
        <nav aria-label="主要功能">
          <button onClick={() => setTab("home")}>首页</button>
          <button onClick={() => setTab("feeding")}>今日</button>
          <button onClick={() => setTab("health")}>健康自查</button>
          <button onClick={goToRecommend}>推荐商城</button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> 给每一只猫，刚刚好的照顾</div>
        <h1>今天，也把它<br /><em>照顾得刚刚好。</em></h1>
        <p>从每一餐、每一口水到每一次状态变化，宠智伴把科学建议变成今天真正做得到的照护。</p>
        <button className="heroCta" onClick={() => { setTab("home"); document.getElementById("app")?.scrollIntoView({ behavior: "smooth" }); }}>查看团子的今天 <span>↓</span></button>
      </section>

      <section className="appShell" id="app">
        <div className="appNav four" role="tablist" aria-label="核心功能">
          <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")} role="tab"><b>01</b><span>首页<small>今天照顾得怎么样</small></span></button>
          <button className={tab === "feeding" ? "active" : ""} onClick={() => setTab("feeding")} role="tab"><b>02</b><span>今日<small>喂养、饮水与任务</small></span></button>
          <button className={tab === "health" ? "active" : ""} onClick={() => setTab("health")} role="tab"><b>03</b><span>健康<small>自查与连续观察</small></span></button>
          <button className={tab === "recommend" ? "active" : ""} onClick={goToRecommend} role="tab"><b>04</b><span>商城<small>按计划匹配商品</small></span></button>
        </div>

        <div className="appContent">
          {tab === "home" && <section className="panel dashboard" aria-labelledby="dashboard-title">
            <div className="dashboardHero"><div><p className="kicker">TODAY WITH {name.toUpperCase() || "MY CAT"}</p><h2 id="dashboard-title">晚上好，{name || "猫咪"}的铲屎官</h2><p>{name || "它"}今天怎么样？喂养方案会根据档案中的月龄、品种、体重和体态自动调整。</p><button onClick={() => goToHomeSection()}>查看或填写猫咪档案 →</button></div><div className="heroCat">{profileImage ? <img src={profileImage} alt={name || "猫咪"} /> : <img src="/og.png" alt="宠智伴猫咪" />}</div></div>
            <div className="homeProfile" id="home-profile"><div className="homeProfileTitle"><div><p className="kicker">CAT PROFILE</p><h3>先填写猫咪档案</h3><p>月龄和品种会直接决定喂养阶段、餐数、干湿比例与商品推荐。</p></div><button className={`miniUpload ${profileImage ? "hasImage" : ""}`} onClick={() => profileImageRef.current?.click()}>{profileImage ? <img src={profileImage} alt="猫咪档案照片"/> : <><span>＋</span>上传照片</>}</button><input ref={profileImageRef} hidden type="file" accept="image/*" onChange={selectProfileImage}/></div>
              <div className="homeProfileFields"><label>名字<input value={name} onChange={(e) => setName(e.target.value)} placeholder="猫咪名字"/></label><label>品种<input list="home-cat-breeds" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="选择或输入品种"/><datalist id="home-cat-breeds">{breeds.map((item) => <option key={item} value={item}/>)}</datalist></label><label>月龄<div className="inputUnit"><input type="number" min="1" max="360" value={ageMonths || ""} onChange={(e) => setAge(Number(e.target.value)/12)} placeholder="例如：8"/><span>个月</span></div></label><label>体重<div className="inputUnit"><input type="number" min=".2" step=".1" value={weight || ""} onChange={(e) => setWeight(Number(e.target.value))}/><span>kg</span></div></label><label>性别<select value={sex} onChange={(e) => setSex(e.target.value)}><option>妹妹</option><option>弟弟</option><option>不确定</option></select></label><label>绝育状态<select value={neutered} onChange={(e) => setNeutered(e.target.value)}><option>已绝育</option><option>未绝育</option><option>不确定</option></select></label></div>
              {recognitionMessage && <div className={`recognitionNote compact ${recognized ? "" : "error"}`}><span>{recognized ? "✓" : "!"}</span><div><strong>{recognitionMessage}</strong><small>{recognitionDetail}</small></div></div>}
              <div className="homeProfileActions"><span>当前方案：{ageMonths}月 · {stagePlan.stage} · {breed || "品种待填写"}</span><button onClick={goToFeeding}>保存档案并生成喂养方案 →</button></div>
            </div>
            <div className="todayCards">
              <button className="todayCard foodCard" onClick={() => setTab("feeding")}><span>🍚 今日喂养</span><strong>{loggedCalories || "待记录"}{loggedCalories > 0 && <> / {calories} <small>kcal</small></>}</strong><p>{loggedCalories > 0 ? `已录入 ${loggedCalories} kcal` : `今日建议目标 ${calories} kcal`}</p><i>查看营养计划 →</i></button>
              <div className="todayCard"><span>🕒 下一餐</span><strong>{nextMeal.split(" · ")[0]}</strong><p>{nextMeal.split(" · ")[1] || "按今日计划喂食"}</p><button onClick={() => setTab("feeding")}>查看分餐安排 →</button></div>
              <div className="todayCard"><span>✓ 今日护理</span><strong>{tasks.filter((task) => task.done).length} / {tasks.length} <small>项完成</small></strong><p>{tasks.find((task) => !task.done)?.label || "今天的护理任务已完成"}</p><button onClick={() => setTab("feeding")}>查看今日计划 →</button></div>
              <div className="todayCard"><span>🐈 今日状态</span><div className="statusChecks">{([['spirit','精神'],['appetite','食欲'],['litter','排泄']] as const).map(([key,label]) => <button className={dailyStatus[key] === true ? "ok" : dailyStatus[key] === false ? "bad" : ""} key={key} onClick={() => setDailyStatus((s) => ({...s,[key]:s[key] === null ? true : s[key] === true ? false : null}))}>{label} {dailyStatus[key] === true ? "✓" : dailyStatus[key] === false ? "!" : "待填"}</button>)}</div><p>{Object.values(dailyStatus).every((v) => v === null) ? "尚未记录今天的状态" : Object.values(dailyStatus).every((v) => v === true) ? "今天状态整体正常" : Object.values(dailyStatus).some((v) => v === false) ? "已记录异常，建议持续观察" : "还有状态未填写"}</p><button onClick={() => setTab("health")}>记录异常 →</button></div>
            </div>
            <div className="dashboardLower"><div className="todoCard"><div className="blockTitle"><div><p className="kicker">DAILY CARE</p><h3>今日待办</h3></div><span>{tasks.some((task) => task.done) ? `${tasks.filter((task) => task.done).length}/${tasks.length} 已完成` : "待填写"}</span></div>{tasks.map((task,index) => <label className={task.done ? "done" : ""} key={task.label}><input type="checkbox" checked={task.done} onChange={() => setTasks((items) => items.map((item,i) => i === index ? {...item,done:!item.done} : item))}/><span>{task.label}{index === 0 && wetPlan ? ` ${Math.round(wetPlan/2)}g` : ""}</span></label>)}</div><div className="insightCard"><p className="kicker">30 DAY SNAPSHOT</p><h3>{name || "猫咪"}的近30天</h3>{weightHistory.length ? <><div className="miniTrend">{weightHistory.map((value,index) => <span key={index} style={{height:`${30 + (value-Math.min(...weightHistory))*90}px`}} title={`${value}kg`}/>)}</div><p>体重 {weightHistory[0]} → <b>{weightHistory[weightHistory.length-1]} kg</b> · BCS {bcs}/9</p></> : <div className="emptyTrend">暂无成长记录<br/><small>记录一次体重后，这里会开始生成趋势</small></div>}<button onClick={() => goToHomeSection("growth-book")}>查看成长手账 →</button></div></div>
            <div className="profileExtras">
              <button className="profileToggle" onClick={() => setProfileOpen((open) => !open)}><span><b>完善健康档案</b><small>饮食、健康、生活和医疗资料可以以后慢慢补充</small></span><strong>{profileOpen ? "收起 ↑" : "展开填写 ↓"}</strong></button>
              {profileOpen && <div className="extraFields">
                <label>生日<input type="date" value={dietInfo.birthday} onChange={(e) => setDietInfo({...dietInfo,birthday:e.target.value})}/></label><label>到家日期<input type="date" value={dietInfo.homeDate} onChange={(e) => setDietInfo({...dietInfo,homeDate:e.target.value})}/></label>
                <label>每日餐数<select value={dietInfo.meals} onChange={(e) => setDietInfo({...dietInfo,meals:e.target.value})}><option>2</option><option>3</option><option>4</option><option>自由采食</option></select></label><label>是否挑食<select value={dietInfo.picky} onChange={(e) => setDietInfo({...dietInfo,picky:e.target.value})}><option>否</option><option>偶尔</option><option>是</option></select></label>
                <label>过敏或不耐受食物<input value={dietInfo.allergy} onChange={(e) => setDietInfo({...dietInfo,allergy:e.target.value})} placeholder="没有可留空"/></label><label>既往疾病<input value={dietInfo.disease} onChange={(e) => setDietInfo({...dietInfo,disease:e.target.value})} placeholder="例如：泌尿问题"/></label>
                <label>长期用药<input value={dietInfo.medicine} onChange={(e) => setDietInfo({...dietInfo,medicine:e.target.value})} placeholder="药名与频率"/></label><label>生活环境<select value={dietInfo.lifestyle} onChange={(e) => setDietInfo({...dietInfo,lifestyle:e.target.value})}><option>纯室内</option><option>偶尔外出</option><option>室外活动</option><option>多猫家庭</option></select></label>
                <label>最近疫苗日期<input type="date" value={dietInfo.vaccine} onChange={(e) => setDietInfo({...dietInfo,vaccine:e.target.value})}/></label><label>最近驱虫日期<input type="date" value={dietInfo.deworm} onChange={(e) => setDietInfo({...dietInfo,deworm:e.target.value})}/></label>
              </div>}
            </div>
            <div className="growthBook" id="growth-book"><div className="blockTitle"><div><p className="kicker">GROWTH JOURNAL</p><h3>{name || "猫咪"}的成长手账</h3></div><button onClick={() => setWeightHistory((items) => [...items.slice(-5),weight])}>＋ 记录当前体重</button></div><div className="historySummary three"><div><span>近30天体重</span><strong>{weightHistory.length ? `${weightHistory[0]} → ${weightHistory[weightHistory.length-1]} kg` : "暂无记录"}</strong></div><div><span>当前 BCS</span><strong>{bcs ? `${bcs}/9` : "待填写"}</strong></div><div><span>健康观察</span><strong>{observations.length ? `${observations.length} 条` : "暂无记录"}</strong></div></div>{weightHistory.length ? <div className="trendBars">{weightHistory.map((value,index) => <div key={index}><span style={{height:`${45 + (value-Math.min(...weightHistory))*150}px`}}/><small>{value}kg</small></div>)}</div> : <div className="emptyTrend large">尚未记录体重，点击“记录当前体重”后生成成长趋势。</div>}<p className="journalNote">重点记录体重、体态和真正出现的异常；无需为了打卡持续盯着喝水或上厕所次数。</p></div>
          </section>}

          {tab === "feeding" && <section className="panel" aria-labelledby="feeding-title">
            <div className="sectionHeading splitHeading"><span className="sectionNo">02</span><div><p className="kicker">DAILY FEEDING</p><h2 id="feeding-title">{name || "猫咪"}的今日喂养方案</h2><p>以当前体重、生命阶段、绝育与活动状态估算，实际用量需结合体态趋势调整。</p></div><span className="statusPill">建议每 2–4 周复核</span></div>
            <div className="profileStrip">
              <div className="catAvatar">{profileImage ? <img src={profileImage} alt="猫咪头像" /> : "猫"}</div>
              <div><strong>{name || "未命名"}</strong><small>{breed} · {sex} · {age < 1 ? `${Math.round(age * 12)} 个月` : `${age} 岁`}</small></div>
              <div className="metric"><span>{weight}</span><small>kg 当前体重</small></div><div className="metric"><span>{bcs}/9</span><small>体态评分</small></div>
              <button className="textButton" onClick={() => goToHomeSection()}>修改档案</button>
            </div>
            <div className="planBasis"><div><span>月龄阶段</span><strong>{ageMonths}月 · {stagePlan.stage}</strong><p>{stagePlan.focus}；默认干湿搭配为湿粮 {Math.round(stagePlan.wetRatio*100)}%＋干粮 {Math.round(stagePlan.dryRatio*100)}%＋零食上限10%。</p></div><div><span>品种修正</span><strong>{breed || "品种待填写"}</strong><p>{breedFeeding}</p></div><button onClick={() => goToHomeSection()}>修改月龄和品种 →</button></div>
            <div className="feedingIntro"><div><p className="kicker">TODAY'S TARGET</p><strong>{calories}</strong><span>kcal 今日目标</span><p>主食建议规划约 {Math.round(calories*.9)} kcal｜零食额度 ≤ {snackTarget} kcal</p></div><div className="nutritionProgress"><span>主食 <b>90%</b></span><i><em style={{width:"90%"}}/></i><span>零食上限 <b>10%</b></span><i className="snack"><em style={{width:`${Math.min(100,snackUsed/snackTarget*100)}%`}}/></i></div><p>{stagePlan.meals}<br/>不建议一次性投喂</p></div>
            <div className="modePicker"><div><b>今天想怎么喂？</b><small>切换后自动重新计算餐量</small></div><div>{(["干粮+湿粮","纯干粮","纯湿粮","自定义搭配"] as FoodMode[]).map((mode) => <button className={foodMode === mode ? "active" : ""} key={mode} onClick={() => setFoodMode(mode)}>{mode}</button>)}</div></div>
            <div className="feedingGrid">
              <div className="planMain">
                <div className="calorieHero"><div><small>每日估算热量</small><strong>{calories}</strong><span>kcal / 天</span></div><div className="ring" style={{ "--progress": `${Math.min(92, 45 + factor * 25)}%` } as React.CSSProperties}><span>{factor.toFixed(2)}×<small>需求系数</small></span></div></div>
                <div className="mealRows detailed">
                  {dryPlan > 0 && <div><span className="mealDot dry"/><div><strong>全价干粮</strong><small>{splitPlan(dryPlan)}</small><button onClick={() => { setHealthGoals(["日常养护"]); goToRecommend(); }}>查看适合{name || "它"}的主粮 →</button></div><b>约 {dryPlan}g</b></div>}
                  {wetPlan > 0 && <div><span className="mealDot wet"/><div><strong>主食罐／湿粮</strong><small>{splitPlan(wetPlan)}</small><button onClick={() => { setHealthGoals(["日常养护","泌尿与饮水"]); goToRecommend(); }}>选购主食湿粮 →</button></div><b>约 {wetPlan}g</b></div>}
                  <div><span className="mealDot treat"/><div><strong>冻干零食</strong><small>训练或互动时少量，已记录 {freezeDried}g</small><button onClick={() => setFreezeDried((g) => g + 3)}>＋ 我今天已经喂了 3g</button></div><b>≤ {Math.max(0,Math.floor(snackTarget/4.5))}g*</b></div>
                  <div><span className="mealDot treat"/><div><strong>猫条</strong><small>与冻干等其他零食共享额度</small><button onClick={() => setTreatSticks((n) => n + 1)}>＋ 我今天已经喂了 1 条</button></div><b>0～{Math.max(0,Math.floor(snackTarget/8))}条*</b></div>
                  <div><span className="mealDot water"/><div><strong>饮水环境</strong><small>保持干净水源并分散设置饮水点；只需留意明显减少、突然增加或排尿困难</small><button onClick={() => { setHealthGoals(["泌尿与饮水"]); goToRecommend(); }}>看看饮水用品 →</button></div><b>无需打卡</b></div>
                </div>
                <p className="formulaNote">示例按湿粮 95 kcal/100g、干粮 380 kcal/100g 计算；请以实际包装热量为准。</p>
                <p className="formulaNote important">* 不同产品热量差异较大，请录入包装热量后计算。所有零食合计不超过每日总热量的 10%。</p>
              </div>
              <aside className="adjustCard">
                <p className="kicker">PERSONALIZE</p><h3>让建议更贴近它</h3>
                <label>日常活动量<select value={activity} onChange={(e) => setActivity(e.target.value)}><option>较少</option><option>适中</option><option>活跃</option></select></label>
                <label>体态评分 BCS：<b>{bcs}/9</b><input className="range" type="range" min="1" max="9" value={bcs} onChange={(e) => setBcs(Number(e.target.value))} /></label>
                <div className="bcsScale"><span>偏瘦</span><span>理想 5</span><span>偏胖</span></div>
                <div className="breedFocus"><span>{breed}</span><strong>重点：{note.focus}</strong>{note.tips.map((tip) => <p key={tip}>— {tip}</p>)}</div>
              </aside>
            </div>
            <div className="snackTracker"><div><p className="kicker">SNACK BUDGET</p><h3>今日零食额度</h3><p>冻干 {freezeDried}g（约{freezeDriedCalories} kcal）＋ 猫条 {treatSticks}条（约{stickCalories} kcal）</p></div><div className="snackGauge"><span style={{width:`${Math.min(100,snackUsed/snackTarget*100)}%`}}/><b>已使用 {Math.round(snackUsed/snackTarget*100)}%</b></div><strong>剩余约 {Math.max(0,snackTarget-snackUsed)} kcal</strong><small>{snackUsed/snackTarget > .65 ? "今天的小嘴巴已经吃得挺开心啦。" : "还可以留给训练或互动时少量奖励。"}</small></div>
            <div className="foodLogger"><div><p className="kicker">ADD TODAY'S FOOD</p><h3>添加今天的食物</h3><p>录入包装热量，系统按实际食物重新计算。</p></div><div className="foodInputs"><input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="例如：皇家成猫粮"/><label><input type="number" value={foodEnergy || ""} onChange={(e) => setFoodEnergy(Number(e.target.value))}/><span>kcal/100g</span></label><label><input type="number" value={foodAmount || ""} onChange={(e) => setFoodAmount(Number(e.target.value))}/><span>计划 g</span></label><button onClick={addFood}>添加</button></div>{foods.length > 0 && <div className="foodList">{foods.map((food) => <span key={food.id}>{food.name} · {food.amount}g · {Math.round(food.energy*food.amount/100)} kcal <button onClick={() => setFoods((items) => items.filter((item) => item.id !== food.id))}>×</button></span>)}</div>}<div className="calorieBalance"><span>今天已经计划 <b>{plannedCalories} / {calories} kcal</b></span><span>剩余 <b>{remainingCalories} kcal</b></span><span>零食还可以吃 <b>≤ {Math.max(0,snackTarget-snackUsed)} kcal</b></span></div></div>
            <div className="sourceLine">计算参考 AAHA / WSAVA 营养评估框架，属于健康成年猫的起始估算，不适用于妊娠、哺乳或疾病处方饮食。</div>
            <button className="shopEntry" onClick={goToRecommend}><span><b>根据这份方案选购用品</b><small>已带入 {name || "猫咪"} 的月龄、品种、体态与喂养结果</small></span><strong>查看推荐商品 →</strong></button>
          </section>}

          {tab === "recommend" && <section className="panel shopPanel" aria-labelledby="recommend-title">
            <div className="sectionHeading splitHeading"><span className="sectionNo shopNo">04</span><div><p className="kicker">SMART MATCH</p><h2 id="recommend-title">{name || "猫咪"}的专属推荐商城</h2><p>按月龄、品种、体态和健康需求筛选；商品佣金不会覆盖健康安全规则。</p></div><span className="statusPill">{recommendedProducts.length} 件匹配</span></div>
            <div className="recommendProfile">
              <div className="catAvatar">{profileImage ? <img src={profileImage} alt="猫咪头像" /> : "猫"}</div>
              <div><strong>{name || "未命名"}</strong><small>{ageMonths} 月龄 · {lifeStage} · {breed} · BCS {bcs}/9</small></div>
              <button className="textButton" onClick={() => goToHomeSection()}>修改档案</button>
            </div>
            <div className="healthSelector"><div><b>健康需求（可多选）</b><small>选择后商品会立即重新匹配</small></div><div className="healthOptions">{["日常养护","体重管理","泌尿与饮水","肠胃敏感","皮肤与毛发","关节与行动","已确诊肾脏疾病"].map((goal) => <label className={healthGoals.includes(goal) ? "checked" : ""} key={goal}><input type="checkbox" checked={healthGoals.includes(goal)} onChange={() => toggleHealthGoal(goal)} /><span>{goal}</span></label>)}</div></div>
            {healthGoals.includes("已确诊肾脏疾病") && <div className="prescriptionAlert"><b>处方饮食提醒</b><span>仅在兽医已确诊并给出饮食建议后购买；本页不推荐药品，也不替代复诊。</span></div>}
            <div className="productGrid">
              {recommendedProducts.map((product, index) => <article className="productCard" key={product.id}>
                <div className="productTop"><span className={`priority p-${product.priority}`}>{product.priority}</span><span>{product.category}</span></div>
                <div className="productIcon">{product.id === "fountain" ? "水" : product.id === "scale" ? "秤" : product.id === "joint" ? "护" : product.id === "brush" ? "梳" : "粮"}</div>
                <h3>{product.name}</h3><b className="match">匹配度 {Math.max(86, 97 - index * 2)}%</b>
                <div className="whyBox"><b>为什么推荐给{name || "它"}？</b><span>✓ {lifeStage} · {ageMonths}月龄</span><span>✓ {neutered} · BCS {bcs}/9</span><span>✓ {product.reason}</span><span className="notBecause">× 不根据佣金提高健康推荐优先级</span></div><p className="caution"><strong>注意：</strong>{product.caution}</p>
                <div className="productBottom"><strong>¥{product.price}<small> 演示价</small></strong><div><button className="planButton" onClick={() => { if(!foods.some((food) => food.name === product.name)) setFoods((items) => [...items,{id:Date.now(),name:product.name,energy:product.id.includes("food") ? 380 : 95,amount:0}]); }}>加入今日计划</button><button onClick={() => setCart((items) => [...items, product])}>加入购物车</button></div></div>
                <a className="buyLink" href={`https://search.jd.com/Search?keyword=${encodeURIComponent(product.keyword)}`} target="_blank" rel="noreferrer">前往可购买页面搜索同类商品 ↗</a>
              </article>)}
            </div>
            <div className="cartBar"><span>已选 <b>{cart.length}</b> 件 · 合计 <strong>¥{cart.reduce((sum, item) => sum + item.price, 0)}</strong></span><button onClick={() => alert(cart.length ? "这是原页面内的购买流程演示。正式版可继续接入地址、优惠、支付和订单履约。" : "请先加入商品。")}>去结算</button></div>
            <p className="shopDisclaimer">商品仅按健康管理需求提供筛选线索，不构成诊断、处方或疗效承诺。持续呕吐、呼吸困难、无法排尿、抽搐或意识异常时应立即就医，不应先购物。</p>
          </section>}

          {tab === "health" && <section className="panel" aria-labelledby="health-title">
            <div className="sectionHeading splitHeading"><span className="sectionNo coral">03</span><div><p className="kicker coralText">HEALTH CHECK</p><h2 id="health-title">症状风险自查</h2><p>上传局部照片并描述变化。系统会先检查急症信号，再调用多模态模型辅助分级。</p></div><span className="statusPill model">模型接口已接入</span></div>
            <div className="safetyBanner"><b>这不是在线确诊</b><span>网页只帮助判断紧急程度和下一步行动；不会开药，也不能替代兽医检查。</span></div>
            <div className="healthGrid">
              <div className="symptomForm">
                <button className={`symptomUpload ${symptomImage ? "hasImage" : ""}`} onClick={() => symptomImageRef.current?.click()}>{symptomImage ? <img src={symptomImage} alt="症状照片预览" /> : <><span>＋</span><div><strong>添加症状照片</strong><small>皮肤、眼睛、排泄物等局部清晰照片</small></div></>}</button>
                <input ref={symptomImageRef} hidden type="file" accept="image/*" onChange={(e) => readImage(e, setSymptomImage)} />
                <label>请描述你观察到的变化<textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="例如：今天反复呕吐 3 次，精神比平时差，喝水正常……" rows={6} /></label>
                <div className="examples"><span>快速示例：</span><button onClick={() => setSymptoms("频繁进猫砂盆但尿不出来，一直叫")}>尿不出来</button><button onClick={() => setSymptoms("今天反复呕吐三次，精神很差")}>反复呕吐</button><button onClick={() => setSymptoms("下巴有一点黑色颗粒，食欲精神正常")}>轻微皮肤异常</button></div>
                <button className="primary healthButton" disabled={healthLoading} onClick={runHealthTriage}>{healthLoading ? "正在分析图片与描述…" : "生成风险提示"} <span>→</span></button>
                {healthNotice && <p className="modelNotice">{healthNotice}</p>}
              </div>
              <div className={`resultCard ${healthResult ? `risk-${healthResult.level}` : "empty"}`} aria-live="polite">
                {!healthResult ? <div className="emptyState"><span>＋</span><strong>等待你的描述</strong><p>提交后，这里会显示风险等级、建议行动和需要继续观察的信号。</p></div> : <>
                  <div className="riskHeader"><span>风险分级</span><b>{healthResult.level}</b></div>
                  <h3>{healthResult.title}</h3><p className="direction">{healthResult.direction}</p>
                  <h4>现在可以做什么</h4><ol>{healthResult.actions.map((item) => <li key={item}>{item}</li>)}</ol>
                  <h4>特别留意</h4><ul>{healthResult.watch.map((item) => <li key={item}>{item}</li>)}</ul>
                  <button className="observeButton" onClick={addObservation}>＋ 加入健康观察</button>
                  <button className="outlineButton" onClick={() => { setHealthResult(undefined); setSymptoms(""); setSymptomImage(""); }}>重新自查</button>
                </>}
              </div>
            </div>
            <div className="observationList"><div className="blockTitle"><div><p className="kicker">FOLLOW UP</p><h3>连续健康观察</h3></div><span>{observations.length} 条进行中</span></div>{observations.length === 0 ? <p className="emptyCopy">自查后点击“加入健康观察”，第二天可以继续记录好转、差不多或加重。</p> : observations.map((item) => <article key={item.id}><div><b>{item.title}</b><small>开始：{item.date} · 初始风险：{item.level}</small></div><div>{(["好转","差不多","加重"] as const).map((status) => <button className={item.status === status ? "active" : ""} key={status} onClick={() => { setObservations((list) => list.map((obs) => obs.id === item.id ? {...obs,status} : obs)); if(status === "加重") setHealthNotice("已标记为加重，建议重新进行风险评估并补充最新照片。"); }}>{status}</button>)}</div></article>)}</div>
          </section>}
        </div>
      </section>

      <section className="nextSteps"><p className="kicker">BUILT TO EVOLVE</p><h2>从今天的照护，看到长期变化。</h2><div><span><b>每天</b>喂养安排、状态确认与必要护理</span><span><b>长期</b>体重体态、连续观察与AI风险分级</span><span><b>下一步</b>迁移微信小程序并接入真实履约</span></div></section>
      <footer><span>宠智伴 · 懂它，更懂如何爱它</span><span><a href="https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/weight-reduction-in-the-obese-pet/" target="_blank">AAHA 营养参考</a> · <a href="https://www.merckvetmanual.com/special-pet-topics/emergencies/evaluation-and-initial-treatment-of-dog-and-cat-emergencies" target="_blank">Merck 急症参考</a></span></footer>
    </main>
  );
}
