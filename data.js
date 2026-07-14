// 공통 데이터 (번역, 증상 목록, 응급 규칙)은 기존과 동일하게 유지하고, Session Storage 헬퍼를 추가합니다.

const translations = {
    ko: {
      lang_name: "한국어", step_0_title: "언어를 선택하세요.", step_1_title: "어디가 아파요?", step_2_title: "어떻게 아파요?", step_3_title: "얼마나 아파요?", step_4_title: "언제부터 아파요?", step_5_title: "이대로 보낼까요?",
      btn_prev: "이전", btn_next: "다음", btn_submit: "맞아요 (보내기)", btn_restart: "다른 곳도 아파요",
      quick_1: "다쳤어요", quick_2: "배가 아파요", quick_3: "머리가 아파요", quick_4: "열이 나요", quick_5: "코피가 나요", quick_6: "토할 것 같아요",
      front: "앞모습", back: "뒷모습", idk: "잘 모르겠어요",
      part_head: "머리", part_eye: "눈", part_ear: "귀", part_nose: "코", part_mouth: "입·이", part_neck: "목",
      part_chest: "가슴", part_belly: "배", part_arm: "팔·손", part_leg: "다리·발", part_back: "등·허리", part_skin: "피부", part_whole: "몸 전체",
      side_select_arm: "어느 쪽 팔이에요?", side_select_leg: "어느 쪽 다리예요?", side_left: "왼쪽", side_right: "오른쪽", side_both: "양쪽 다",
      belly_top: "윗배", belly_navel: "배꼽 주변", belly_bottom: "아랫배", belly_right_bottom: "오른쪽 아래",
      arm_upper: "어깨·윗팔", arm_lower: "팔꿈치·아랫팔", arm_hand: "손·손목",
      leg_thigh: "허벅지", leg_knee: "무릎", leg_calf: "종아리·발목", leg_foot: "발",
      hurt_how: "어떻게 다쳤어요?", hurt_state: "지금 상태는요?",
      hurt_1: "넘어짐", hurt_2: "부딪힘", hurt_3: "베임", hurt_4: "접질림",
      state_1: "피가 나요", state_2: "부었어요", state_3: "멍들었어요", state_4: "움직이면 아파요",
      head_q: "어지럽거나 토할 것 같아요?", yes: "네", no: "아니요",
      time_1: "방금 전", time_2: "오늘 아침", time_3: "어제", time_4: "며칠 전",
      follow_belly: "밥을 먹었어요?", follow_fever: "약을 먹었어요?", follow_vomit: "몇 번 토했어요?",
      vomit_1: "1번", vomit_2: "2번", vomit_3: "3번 이상",
      allergy_title: "알레르기가 있어요?", allergy_none: "없어요", allergy_drug: "약", allergy_peanut: "땅콩/견과류", allergy_milk: "우유", allergy_egg: "계란", allergy_seafood: "해산물", allergy_peach: "복숭아", allergy_wheat: "밀가루",
      nurse_mode: "보건교사 모드", pin_prompt: "비밀번호를 입력하세요:", no_records: "접수된 문진표가 없습니다.", delete: "삭제", summary_title: "AI 요약 내용", error_api: "요약 생성 중 오류가 발생했습니다.",
      summary_symptom: "증상", summary_part: "부위", summary_symptom_label: "증상", summary_pain: "통증 정도", summary_time: "시작 시간", summary_allergy_info: "🏥 알레르기 정보", summary_allergy_label: "알레르기",
      pain_min: "안 아파요", pain_max: "너무 아파요", btn_start_over: "새로 작성하기"
    },
    en: {
        lang_name: "English", step_0_title: "Choose your language.", step_1_title: "Where does it hurt?", step_2_title: "How does it hurt?", step_3_title: "How much does it hurt?", step_4_title: "When did it start?", step_5_title: "Is this correct?",
        btn_prev: "Previous", btn_next: "Next", btn_submit: "Submit", btn_restart: "Add other symptoms",
        quick_1: "I am hurt", quick_2: "Stomachache", quick_3: "Headache", quick_4: "Fever", quick_5: "Nosebleed", quick_6: "Feel like vomiting",
        front: "Front", back: "Back", idk: "I don't know",
        part_head: "Head", part_eye: "Eyes", part_ear: "Ears", part_nose: "Nose", part_mouth: "Mouth/Teeth", part_neck: "Neck",
        part_chest: "Chest", part_belly: "Belly", part_arm: "Arm/Hand", part_leg: "Leg/Foot", part_back: "Back", part_skin: "Skin", part_whole: "Whole body",
        side_select_arm: "Which arm?", side_select_leg: "Which leg?", side_left: "Left", side_right: "Right", side_both: "Both",
        belly_top: "Upper belly", belly_navel: "Around navel", belly_bottom: "Lower belly", belly_right_bottom: "Right lower belly",
        arm_upper: "Shoulder/Upper arm", arm_lower: "Elbow/Lower arm", arm_hand: "Hand/Wrist",
        leg_thigh: "Thigh", leg_knee: "Knee", leg_calf: "Calf/Ankle", leg_foot: "Foot",
        hurt_how: "How did you get hurt?", hurt_state: "How is it now?",
        hurt_1: "Fell down", hurt_2: "Bumped", hurt_3: "Cut", hurt_4: "Sprained",
        state_1: "Bleeding", state_2: "Swollen", state_3: "Bruised", state_4: "Hurts when moving",
        head_q: "Do you feel dizzy or feel like vomiting?", yes: "Yes", no: "No",
        time_1: "Just now", time_2: "This morning", time_3: "Yesterday", time_4: "A few days ago",
        follow_belly: "Did you eat?", follow_fever: "Did you take medicine?", follow_vomit: "How many times did you vomit?",
        vomit_1: "1 time", vomit_2: "2 times", vomit_3: "3 or more times",
        allergy_title: "Do you have any allergies?", allergy_none: "None", allergy_drug: "Medicine", allergy_peanut: "Peanuts/Nuts", allergy_milk: "Milk", allergy_egg: "Eggs", allergy_seafood: "Seafood", allergy_peach: "Peach", allergy_wheat: "Wheat",
        nurse_mode: "Nurse Mode", pin_prompt: "Enter PIN:", no_records: "No records found.", delete: "Delete", summary_title: "AI Summary", error_api: "Error generating summary.",
        summary_symptom: "Symptom", summary_part: "Part", summary_symptom_label: "Symptoms", summary_pain: "Pain Level", summary_time: "Start Time", summary_allergy_info: "🏥 Allergy Info", summary_allergy_label: "Allergies",
        pain_min: "No pain", pain_max: "Worst pain", btn_start_over: "Start over"
    },
    zh: {
        lang_name: "中文", step_0_title: "请选择语言。", step_1_title: "哪里不舒服？", step_2_title: "怎么不舒服？", step_3_title: "有多痛？", step_4_title: "什么时候开始的？", step_5_title: "这样发送吗？",
        btn_prev: "上一步", btn_next: "下一步", btn_submit: "确认 (发送)", btn_restart: "添加其他症状",
        quick_1: "受伤了", quick_2: "肚子痛", quick_3: "头痛", quick_4: "发烧", quick_5: "流鼻血", quick_6: "想吐",
        front: "正面", back: "背面", idk: "不知道",
        part_head: "头", part_eye: "眼睛", part_ear: "耳朵", part_nose: "鼻子", part_mouth: "嘴/牙齿", part_neck: "脖子",
        part_chest: "胸", part_belly: "肚子", part_arm: "胳膊/手", part_leg: "腿/脚", part_back: "背/腰", part_skin: "皮肤", part_whole: "全身",
        side_select_arm: "哪只胳膊？", side_select_leg: "哪条腿？", side_left: "左边", side_right: "右边", side_both: "两边都",
        belly_top: "上腹", belly_navel: "肚脐周围", belly_bottom: "下腹", belly_right_bottom: "右下腹",
        arm_upper: "肩膀/上臂", arm_lower: "手肘/前臂", arm_hand: "手/手腕",
        leg_thigh: "大腿", leg_knee: "膝盖", leg_calf: "小腿/脚踝", leg_foot: "脚",
        hurt_how: "怎么受伤的？", hurt_state: "现在怎么样？",
        hurt_1: "摔倒", hurt_2: "撞到", hurt_3: "割伤", hurt_4: "扭伤",
        state_1: "流血", state_2: "肿了", state_3: "瘀青", state_4: "一动就痛",
        head_q: "觉得头晕或想吐吗？", yes: "是", no: "否",
        time_1: "刚刚", time_2: "今天早上", time_3: "昨天", time_4: "几天前",
        follow_belly: "吃饭了吗？", follow_fever: "吃药了吗？", follow_vomit: "吐了几次？",
        vomit_1: "1次", vomit_2: "2次", vomit_3: "3次以上",
        allergy_title: "有过敏吗？", allergy_none: "没有", allergy_drug: "药物", allergy_peanut: "花生/坚果", allergy_milk: "牛奶", allergy_egg: "鸡蛋", allergy_seafood: "海鲜", allergy_peach: "桃子", allergy_wheat: "小麦",
        nurse_mode: "护士模式", pin_prompt: "请输入密码:", no_records: "没有记录。", delete: "删除", summary_title: "AI 总结", error_api: "生成总结时出错。",
        summary_symptom: "症状", summary_part: "部位", summary_symptom_label: "症状", summary_pain: "疼痛程度", summary_time: "开始时间", summary_allergy_info: "🏥 过敏信息", summary_allergy_label: "过敏",
        pain_min: "不痛", pain_max: "非常痛", btn_start_over: "重新填写"
    },
    ru: {
        lang_name: "Русский", step_0_title: "Выберите язык.", step_1_title: "Где болит?", step_2_title: "Как болит?", step_3_title: "Насколько сильно болит?", step_4_title: "Когда это началось?", step_5_title: "Всё верно?",
        btn_prev: "Назад", btn_next: "Вперед", btn_submit: "Отправить", btn_restart: "Добавить еще симптомы",
        quick_1: "Я поранился(лась)", quick_2: "Болит живот", quick_3: "Болит голова", quick_4: "Температура", quick_5: "Кровь из носа", quick_6: "Тошнит",
        front: "Спереди", back: "Сзади", idk: "Я не знаю",
        part_head: "Голова", part_eye: "Глаза", part_ear: "Уши", part_nose: "Нос", part_mouth: "Рот/зубы", part_neck: "Шея",
        part_chest: "Грудь", part_belly: "Живот", part_arm: "Рука/кисть", part_leg: "Нога/ступня", part_back: "Спина/поясница", part_skin: "Кожа", part_whole: "Всё тело",
        side_select_arm: "Какая рука?", side_select_leg: "Какая нога?", side_left: "Левая", side_right: "Правая", side_both: "Обе",
        belly_top: "Верх живота", belly_navel: "Вокруг пупка", belly_bottom: "Низ живота", belly_right_bottom: "Внизу справа",
        arm_upper: "Плечо/Предплечье", arm_lower: "Локоть/Предплечье", arm_hand: "Кисть/Запястье",
        leg_thigh: "Бедро", leg_knee: "Колено", leg_calf: "Икра/Лодыжка", leg_foot: "Ступня",
        hurt_how: "Как вы поранились?", hurt_state: "Как сейчас?",
        hurt_1: "Упал(а)", hurt_2: "Ударился(лась)", hurt_3: "Порезался(лась)", hurt_4: "Растяжение",
        state_1: "Идет кровь", state_2: "Опухло", state_3: "Синяк", state_4: "Больно двигать",
        head_q: "Кружится голова или тошнит?", yes: "Да", no: "Нет",
        time_1: "Только что", time_2: "Сегодня утром", time_3: "Вчера", time_4: "Несколько дней назад",
        follow_belly: "Вы ели?", follow_fever: "Вы пили лекарство?", follow_vomit: "Сколько раз вас стошнило?",
        vomit_1: "1 раз", vomit_2: "2 раза", vomit_3: "3 или более раз",
        allergy_title: "Есть аллергия?", allergy_none: "Нет", allergy_drug: "Лекарства", allergy_peanut: "Арахис/Орехи", allergy_milk: "Молоко", allergy_egg: "Яйца", allergy_seafood: "Морепродукты", allergy_peach: "Персик", allergy_wheat: "Пшеница",
        nurse_mode: "Режим медсестры", pin_prompt: "Введите пароль:", no_records: "Записей нет.", delete: "Удалить", summary_title: "Сводка ИИ", error_api: "Ошибка генерации сводки.",
        summary_symptom: "Симптом", summary_part: "Часть", summary_symptom_label: "Симптомы", summary_pain: "Уровень боли", summary_time: "Время начала", summary_allergy_info: "🏥 Инфо об аллергии", summary_allergy_label: "Аллергии",
        pain_min: "Не болит", pain_max: "Очень больно", btn_start_over: "Начать заново"
    },
    vi: {
        lang_name: "Tiếng Việt", step_0_title: "Chọn ngôn ngữ của bạn.", step_1_title: "Đau ở đâu?", step_2_title: "Đau như thế nào?", step_3_title: "Đau nhiều không?", step_4_title: "Bắt đầu từ khi nào?", step_5_title: "Như thế này đúng không?",
        btn_prev: "Trước", btn_next: "Tiếp theo", btn_submit: "Gửi", btn_restart: "Thêm triệu chứng khác",
        quick_1: "Bị thương", quick_2: "Đau bụng", quick_3: "Đau đầu", quick_4: "Sốt", quick_5: "Chảy máu cam", quick_6: "Buồn nôn",
        front: "Phía trước", back: "Phía sau", idk: "Không biết",
        part_head: "Đầu", part_eye: "Mắt", part_ear: "Tai", part_nose: "Mũi", part_mouth: "Miệng/Răng", part_neck: "Cổ",
        part_chest: "Ngực", part_belly: "Bụng", part_arm: "Tay", part_leg: "Chân", part_back: "Lưng/Eo", part_skin: "Da", part_whole: "Toàn thân",
        side_select_arm: "Tay nào?", side_select_leg: "Chân nào?", side_left: "Trái", side_right: "Phải", side_both: "Cả hai",
        belly_top: "Bụng trên", belly_navel: "Quanh rốn", belly_bottom: "Bụng dưới", belly_right_bottom: "Dưới bên phải",
        arm_upper: "Vai/Cánh tay trên", arm_lower: "Khuỷu tay/Cẳng tay", arm_hand: "Bàn tay/Cổ tay",
        leg_thigh: "Đùi", leg_knee: "Đầu gối", leg_calf: "Bắp chân/Mắt cá chân", leg_foot: "Bàn chân",
        hurt_how: "Bị thương thế nào?", hurt_state: "Bây giờ thế nào?",
        hurt_1: "Ngã", hurt_2: "Va đập", hurt_3: "Bị cắt", hurt_4: "Bong gân",
        state_1: "Chảy máu", state_2: "Sưng", state_3: "Bầm tím", state_4: "Đau khi cử động",
        head_q: "Có thấy chóng mặt hay buồn nôn không?", yes: "Có", no: "Không",
        time_1: "Vừa xong", time_2: "Sáng nay", time_3: "Hôm qua", time_4: "Vài ngày trước",
        follow_belly: "Đã ăn chưa?", follow_fever: "Đã uống thuốc chưa?", follow_vomit: "Nôn mấy lần rồi?",
        vomit_1: "1 lần", vomit_2: "2 lần", vomit_3: "3 lần trở lên",
        allergy_title: "Có dị ứng không?", allergy_none: "Không có", allergy_drug: "Thuốc", allergy_peanut: "Đậu phộng/Hạt", allergy_milk: "Sữa", allergy_egg: "Trứng", allergy_seafood: "Hải sản", allergy_peach: "Đào", allergy_wheat: "Lúa mì",
        nurse_mode: "Chế độ y tá", pin_prompt: "Nhập mật khẩu:", no_records: "Không có hồ sơ.", delete: "Xóa", summary_title: "Tóm tắt AI", error_api: "Lỗi tạo tóm tắt.",
        summary_symptom: "Triệu chứng", summary_part: "Bộ phận", summary_symptom_label: "Các triệu chứng", summary_pain: "Mức độ đau", summary_time: "Thời gian bắt đầu", summary_allergy_info: "🏥 Thông tin dị ứng", summary_allergy_label: "Dị ứng",
        pain_min: "Không đau", pain_max: "Rất đau", btn_start_over: "Làm lại từ đầu"
    }
  };
  
  const tts_codes = { ko: "ko-KR", en: "en-US", zh: "zh-CN", ru: "ru-RU", vi: "vi-VN" };
  
  const symptomsData = {
    "머리": [
      { id: "s1", icon: "🤕", ko: "지끈지끈 아파요", en: "Throbbing headache", zh: "一阵阵地疼", ru: "Пульсирующая боль", vi: "Đau nhức" },
      { id: "s2", icon: "💫", ko: "어지러워요", en: "Dizzy", zh: "头晕", ru: "Кружится голова", vi: "Chóng mặt" },
      { id: "s3", icon: "💥", ko: "부딪혔어요", en: "Bumped my head", zh: "撞到了", ru: "Ударился(лась)", vi: "Bị va đập" },
      { id: "s4", icon: "😵‍💫", ko: "멍해요", en: "Feeling dazed", zh: "发呆", ru: "В ступоре", vi: "Choáng váng" }
    ],
    "팔·손": [
      { id: "ag1", icon: "🩹", ko: "긁히고 까졌어요", en: "Scraped", zh: "擦伤了", ru: "Ссадина", vi: "Bị trầy" },
      { id: "ag2", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "ag3", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "ag4", icon: "⚡", ko: "삐었어요", en: "Sprained", zh: "扭伤", ru: "Растяжение", vi: "Bong gân" },
      { id: "ag5", icon: "🩸", ko: "피가 나요", en: "Bleeding", zh: "流血", ru: "Идёт кровь", vi: "Chảy máu" },
      { id: "ag6", icon: "😣", ko: "움직이면 아파요", en: "Hurts when moving", zh: "动就疼", ru: "Больно двигать", vi: "Đau khi cử động" }
    ],
    "다리·발": [
      { id: "lg1", icon: "🩹", ko: "까졌어요", en: "Scraped", zh: "擦伤了", ru: "Ссадина", vi: "Bị trầy" },
      { id: "lg2", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "lg3", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "lg4", icon: "⚡", ko: "삐었어요", en: "Sprained", zh: "扭伤", ru: "Растяжение", vi: "Bong gân" },
      { id: "lg5", icon: "🩸", ko: "피가 나요", en: "Bleeding", zh: "流血", ru: "Идёт кровь", vi: "Chảy máu" },
      { id: "lg6", icon: "🚶", ko: "걸으면 아파요", en: "Hurts to walk", zh: "走路疼", ru: "Больно ходить", vi: "Đau khi đi" }
    ],
    "눈": [
      { id: "e1", icon: "🫣", ko: "가려워요", en: "Itchy", zh: "痒", ru: "Чешется", vi: "Ngứa" },
      { id: "e2", icon: "👁️", ko: "아파요", en: "Hurts", zh: "疼", ru: "Болит", vi: "Đau" },
      { id: "e3", icon: "🩸", ko: "빨개요", en: "Red", zh: "红了", ru: "Покраснел", vi: "Đỏ" },
      { id: "e4", icon: "😭", ko: "뭐가 들어갔어요", en: "Something got in", zh: "进了东西", ru: "Что-то попало", vi: "Có gì vào mắt" }
    ],
    "귀": [
      { id: "ea1", icon: "👂", ko: "아파요", en: "Hurts", zh: "疼", ru: "Болит", vi: "Đau" },
      { id: "ea2", icon: "🙉", ko: "잘 안 들려요", en: "Can't hear well", zh: "听不清", ru: "Плохо слышу", vi: "Nghe không rõ" },
      { id: "ea3", icon: "🔔", ko: "소리가 나요", en: "Ringing sound", zh: "耳鸣", ru: "Шум в ушах", vi: "Ù tai" }
    ],
    "코": [
      { id: "n1", icon: "💧", ko: "콧물이 나요", en: "Runny nose", zh: "流鼻涕", ru: "Насморк", vi: "Chảy nước mũi" },
      { id: "n2", icon: "🤧", ko: "막혔어요", en: "Stuffy nose", zh: "鼻塞", ru: "Заложен нос", vi: "Nghẹt mũi" },
      { id: "n3", icon: "🩸", ko: "코피가 나요", en: "Nosebleed", zh: "流鼻血", ru: "Кровь из носа", vi: "Chảy máu cam" },
      { id: "n4", icon: "💨", ko: "재채기가 나요", en: "Sneezing", zh: "打喷嚏", ru: "Чихаю", vi: "Hắt hơi" }
    ],
    "입·이": [
      { id: "m1", icon: "🦷", ko: "이가 아파요", en: "Toothache", zh: "牙疼", ru: "Болит зуб", vi: "Đau răng" },
      { id: "m2", icon: "〰️", ko: "이가 흔들려요", en: "Loose tooth", zh: "牙齿松动", ru: "Шатается зуб", vi: "Răng lung lay" },
      { id: "m3", icon: "👅", ko: "입안이 헐었어요", en: "Mouth sore", zh: "口腔溃疡", ru: "Язвочка во рту", vi: "Lở miệng" }
    ],
    "목": [
      { id: "nk1", icon: "😫", ko: "삼킬 때 아파요", en: "Hurts to swallow", zh: "吞咽时疼", ru: "Больно глотать", vi: "Nuốt đau" },
      { id: "nk2", icon: "😷", ko: "기침이 나요", en: "Coughing", zh: "咳嗽", ru: "Кашель", vi: "Ho" },
      { id: "nk3", icon: "🤐", ko: "목소리가 안 나와요", en: "Lost my voice", zh: "发不出声音", ru: "Пропал голос", vi: "Mất tiếng" },
      { id: "nk4", icon: "🙅", ko: "목을 못 돌려요", en: "Can't turn neck", zh: "脖子转不了", ru: "Не могу повернуть шею", vi: "Không quay được cổ" }
    ],
    "가슴": [
      { id: "c1", icon: "😮‍💨", ko: "숨쉬기 힘들어요", en: "Hard to breathe", zh: "呼吸困难", ru: "Трудно дышать", vi: "Khó thở" },
      { id: "c2", icon: "⚡", ko: "콕콕 아파요", en: "Sharp pain", zh: "刺痛", ru: "Колющая боль", vi: "Đau nhói" },
      { id: "c3", icon: "💓", ko: "두근거려요", en: "Heart pounding", zh: "心跳加速", ru: "Сердце колотится", vi: "Tim đập nhanh" },
      { id: "c4", icon: "🧱", ko: "답답해요", en: "Feels tight", zh: "胸闷", ru: "Давит в груди", vi: "Tức ngực" }
    ],
    "배": [
      { id: "b1", icon: "⚡", ko: "콕콕 찔러요", en: "Sharp stinging", zh: "刺痛", ru: "Колет", vi: "Đau nhói" },
      { id: "b2", icon: "🌪️", ko: "쥐어짜듯 아파요", en: "Cramping pain", zh: "绞痛", ru: "Крутит живот", vi: "Đau quặn" },
      { id: "b3", icon: "🤢", ko: "토할 것 같아요", en: "Feel like vomiting", zh: "想吐", ru: "Тошнит", vi: "Buồn nôn" },
      { id: "b4", icon: "💩", ko: "설사했어요", en: "Diarrhea", zh: "拉肚子", ru: "Понос", vi: "Tiêu chảy" },
      { id: "b5", icon: "🚽", ko: "화장실 못 갔어요", en: "Can't go to bathroom", zh: "上不了厕所", ru: "Не могу сходить в туалет", vi: "Không đi vệ sinh được" }
    ],
    "어깨·윗팔": [
      { id: "au1", icon: "💫", ko: "어깨가 아파요", en: "Shoulder hurts", zh: "肩膀疼", ru: "Болит плечо", vi: "Đau vai" },
      { id: "au2", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "au3", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "au4", icon: "😵‍💫", ko: "팔을 못 들겠어요", en: "Can't lift arm", zh: "抬不起胳膊", ru: "Не могу поднять руку", vi: "Không nâng được tay" },
      { id: "au5", icon: "😣", ko: "움직이면 아파요", en: "Hurts when moving", zh: "动就疼", ru: "Больно двигать", vi: "Đau khi cử động" }
    ],
    "팔꿈치·아랫팔": [
      { id: "al1", icon: "🩹", ko: "긁히고 까졌어요", en: "Scraped", zh: "擦伤了", ru: "Ссадина", vi: "Bị trầy" },
      { id: "al2", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "al3", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "al4", icon: "⚡", ko: "굽힐 때 아파요", en: "Hurts to bend", zh: "弯曲时疼", ru: "Больно сгибать", vi: "Đau khi gập" },
      { id: "al5", icon: "🩸", ko: "피가 나요", en: "Bleeding", zh: "流血", ru: "Идёт кровь", vi: "Chảy máu" }
    ],
    "손·손목": [
      { id: "ah1", icon: "🩹", ko: "긁히고 까졌어요", en: "Scraped", zh: "擦伤了", ru: "Ссадина", vi: "Bị trầy" },
      { id: "ah2", icon: "⚡", ko: "손목을 삐었어요", en: "Sprained wrist", zh: "手腕扭伤", ru: "Растянул(а) запястье", vi: "Bong gân cổ tay" },
      { id: "ah3", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "ah4", icon: "🩸", ko: "피가 나요", en: "Bleeding", zh: "流血", ru: "Идёт кровь", vi: "Chảy máu" },
      { id: "ah5", icon: "😣", ko: "움직이면 아파요", en: "Hurts when moving", zh: "动就疼", ru: "Больно двигать", vi: "Đau khi cử động" },
      { id: "ah6", icon: "🫐", ko: "손가락이 끼였어요", en: "Finger got caught", zh: "手指夹到了", ru: "Прищемил(а) палец", vi: "Kẹt ngón tay" }
    ],
    "허벅지": [
      { id: "lt1", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "lt2", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "lt3", icon: "🩸", ko: "피가 나요", en: "Bleeding", zh: "流血", ru: "Идёт кровь", vi: "Chảy máu" },
      { id: "lt4", icon: "🩹", ko: "긁히고 까졌어요", en: "Scraped", zh: "擦伤了", ru: "Ссадина", vi: "Bị trầy" },
      { id: "lt5", icon: "😣", ko: "움직이면 아파요", en: "Hurts when moving", zh: "动就疼", ru: "Больно двигать", vi: "Đau khi cử động" }
    ],
    "무릎": [
      { id: "lk1", icon: "🩹", ko: "무릎이 까졌어요", en: "Scraped knee", zh: "膝盖擦伤了", ru: "Ссадина на колене", vi: "Trầy đầu gối" },
      { id: "lk2", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "lk3", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "lk4", icon: "🩸", ko: "피가 나요", en: "Bleeding", zh: "流血", ru: "Идёт кровь", vi: "Chảy máu" },
      { id: "lk5", icon: "😵‍💫", ko: "굽히면 아파요", en: "Hurts to bend", zh: "弯曲时疼", ru: "Больно сгибать", vi: "Đau khi gập" }
    ],
    "종아리·발목": [
      { id: "lc1", icon: "⚡", ko: "발목을 삐었어요", en: "Sprained ankle", zh: "扭伤脚踝", ru: "Подвернул(а) ногу", vi: "Bong gân mắt cá" },
      { id: "lc2", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "lc3", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "lc4", icon: "🚶", ko: "걸으면 아파요", en: "Hurts to walk", zh: "走路疼", ru: "Больно ходить", vi: "Đau khi đi" }
    ],
    "발": [
      { id: "lf1", icon: "🩹", ko: "까졌어요", en: "Scraped", zh: "擦伤了", ru: "Ссадина", vi: "Bị trầy" },
      { id: "lf2", icon: "🎈", ko: "부었어요", en: "Swollen", zh: "肿了", ru: "Опухло", vi: "Sưng" },
      { id: "lf3", icon: "🩸", ko: "피가 나요", en: "Bleeding", zh: "流血", ru: "Идёт кровь", vi: "Chảy máu" },
      { id: "lf4", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" },
      { id: "lf5", icon: "🫧", ko: "물집이 생겼어요", en: "Blister", zh: "起水泡了", ru: "Мозоль/волдырь", vi: "Phồng rộp" }
    ],
    "등·허리": [
      { id: "bk1", icon: "⚡", ko: "아파요", en: "Hurts", zh: "疼", ru: "Болит", vi: "Đau" },
      { id: "bk2", icon: "💥", ko: "부딪혔어요", en: "Bumped", zh: "撞到了", ru: "Ударился(лась)", vi: "Bị va đập" },
      { id: "bk3", icon: "😣", ko: "허리를 못 펴겠어요", en: "Can't straighten back", zh: "直不起腰", ru: "Не могу разогнуться", vi: "Không duỗi được lưng" },
      { id: "bk4", icon: "🫐", ko: "멍이 들었어요", en: "Bruised", zh: "淤青了", ru: "Синяк", vi: "Bầm tím" }
    ],
    "피부": [
      { id: "sk1", icon: "🤚", ko: "가려워요", en: "Itchy", zh: "痒", ru: "Чешется", vi: "Ngứa" },
      { id: "sk2", icon: "🔴", ko: "두드러기가 났어요", en: "Hives", zh: "起荨麻疹了", ru: "Крапивница", vi: "Nổi mề đay" },
      { id: "sk3", icon: "🔥", ko: "데었어요", en: "Burned", zh: "烫伤了", ru: "Обжёгся(лась)", vi: "Bị bỏng" },
      { id: "sk4", icon: "💧", ko: "물집이 생겼어요", en: "Blister", zh: "起水泡了", ru: "Мозоль/волдырь", vi: "Phồng rộp" }
    ],
    "몸 전체": [
      { id: "w1", icon: "🤒", ko: "열이 나요", en: "Fever", zh: "发烧", ru: "Температура", vi: "Sốt" },
      { id: "w2", icon: "🥶", ko: "춥고 떨려요", en: "Cold and shivering", zh: "发冷发抖", ru: "Озноб", vi: "Lạnh run" },
      { id: "w3", icon: "🫠", ko: "기운이 없어요", en: "No energy", zh: "没力气", ru: "Нет сил", vi: "Mệt mỏi" },
      { id: "w4", icon: "🥱", ko: "잠이 계속 와요", en: "Very sleepy", zh: "一直想睡觉", ru: "Всё время хочу спать", vi: "Buồn ngủ" },
      { id: "w5", icon: "🤕", ko: "온몸이 쑤셔요", en: "Body aches", zh: "全身酸痛", ru: "Ломит всё тело", vi: "Nhức mỏi toàn thân" }
    ]
  };
  
  const evaluateEmergency = (entries) => {
    let flags = new Set();
    let allSymptoms = entries.flatMap(e => e.symptoms.map(s => s.ko || s)).join(" ");
    let maxPain = 0;
    entries.forEach(e => {
      if (e.painLevels) {
        Object.values(e.painLevels).forEach(p => {
          if (parseInt(p) > maxPain) maxPain = parseInt(p);
        });
      } else if (e.painLevel) {
        if (parseInt(e.painLevel) > maxPain) maxPain = parseInt(e.painLevel);
      }
    });
    
    entries.forEach(data => {
      const symptomsStr = data.symptoms.map(s => s.ko || s).join(" ");
      
      if (data.part === "머리" && data.hurtMethod && (data.headQ === "yes" || symptomsStr.includes("토할 것 같아요") || symptomsStr.includes("어지러워요"))) {
        flags.add("뇌진탕 의심");
      }
      if (data.part === "배" && data.bellyPos === "오른쪽 아래" && maxPain >= 8) {
        flags.add("충수염 의심");
      }
    });


    if (allSymptoms.includes("두드러기가 났어요") && allSymptoms.includes("숨쉬기 힘들어요")) {
      flags.add("알레르기 쇼크 의심");
    }
    if (allSymptoms.includes("숨쉬기 힘들어요")) {
      flags.add("호흡곤란 의심");
    }
    if (maxPain >= 8) {
      flags.add("고강도 통증");
    }
    
    return Array.from(flags);
  };

  // State Management Helpers
  function getState() {
      const defaultState = { lang: 'ko', part: null, bellyPos: null, hurtMethod: null, hurtState: null, headQ: null, symptoms: [], painLevels: {}, startTime: null, followups: [], previousEntries: [], headSubSelected: false };
      return JSON.parse(sessionStorage.getItem('medical_state')) || defaultState;
  }

  function saveState(state) {
      sessionStorage.setItem('medical_state', JSON.stringify(state));
  }

  function clearState() {
      sessionStorage.removeItem('medical_state');
  }

  // UI Helpers
  function translateKoToLang(koStr, lang) {
      if (!lang || lang === 'ko' || !koStr) return koStr;
      const tLang = translations[lang];
      const tKo = translations.ko;
      
      let result = koStr;
      // 1. 단일 부위 완전 일치 검사 (ex: "머리" -> "Head")
      for (const key in tKo) {
          if (tKo[key] === result && tLang[key]) return tLang[key];
      }
      
      // 1.5. 증상 딕셔너리 검사 (symptomsData)
      for (const part in symptomsData) {
          const list = symptomsData[part];
          for (const item of list) {
              if (item.ko === result && item[lang]) return item[lang];
          }
      }
      
      // 2. 복합 문자열 치환 (ex: "팔·손 (왼쪽 어깨·윗팔)" -> "Arm/Hand (Left Shoulder/Upper arm)")
      const keys = Object.keys(tKo).sort((a, b) => tKo[b].length - tKo[a].length);
      for (const key of keys) {
          if (tKo[key] && typeof tKo[key] === 'string' && tKo[key].length > 1) {
              // 치환 시 정규식으로 안전하게 바꿈
              result = result.split(tKo[key]).join(tLang[key] || tKo[key]);
          }
      }
      return result;
  }

  function applyLanguageToUI() {
      const state = getState();
      document.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          if (translations[state.lang] && translations[state.lang][key]) {
              el.innerHTML = translations[state.lang][key];
          }
      });
  }

  function speak(text) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = tts_codes[getState().lang] || "ko-KR";
      window.speechSynthesis.speak(utterance);
  }

  // Setup Common UI (Header, Speaker)
  document.addEventListener('DOMContentLoaded', () => {
      applyLanguageToUI();
      document.querySelectorAll('.btn-speaker').forEach(btn => {
          btn.addEventListener('click', (e) => {
              const textSpan = e.currentTarget.parentElement.querySelector('span[data-i18n]');
              if (textSpan) {
                  const key = textSpan.getAttribute('data-i18n');
                  speak(translations[getState().lang][key]);
              }
          });
      });
      const nurseBtn = document.getElementById('btn-nurse-lock');
      if (nurseBtn) {
          nurseBtn.addEventListener('click', () => {
              const pin = prompt(translations[getState().lang]?.pin_prompt || "비밀번호:");
              if (pin === "1234") window.location.href = 'nurse.html';
              else if (pin !== null) alert("비밀번호가 틀렸습니다.");
          });
      }
  });
