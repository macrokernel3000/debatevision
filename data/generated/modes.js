window.DEBATE_MODES = [
  {
    "id": "item-survival",
    "order": 1,
    "title": "異境求生",
    "icon": "◆",
    "tone": "danger",
    "track": "異境 × 卡牌",
    "primaryDeck": "items",
    "variantDecks": [
      "items",
      "roles"
    ],
    "variantLabels": {
      "items": "道具",
      "roles": "職業"
    },
    "secondaryDeck": "worlds",
    "primaryLabel": "求生卡",
    "secondaryLabel": "異境卡",
    "defaultRarities": {
      "items": [
        "A",
        "B",
        "C"
      ]
    },
    "drawLabel": "抽出求生組合",
    "cardMode": "itemEnvironment",
    "description": "用抽到的道具或職業盡力生存，或選出最適格的探險隊前往異境。",
    "prompts": [
      [
        "環境限制",
        "這個異境最令人擔憂的生存條件是什麼？"
      ],
      [
        "資源分工",
        "請各組說明道具如何搭配職業夥伴。"
      ],
      [
        "局部有效",
        "如果有道具能發揮一個很小卻明確的用途，那也令人讚賞。"
      ]
    ],
    "flow": [
      "選擇求生版或冒險版",
      "抽道具或職業；也可勾選無異境",
      "冒險版設定隊伍數，再分別設定每隊會抽到幾張道具、職業、動物、異族、超能、特職",
      "冒險版所有組別共用同一個異境，但各組拿到不同探險隊",
      "各組上台說明：我們的探險隊為什麼最適合前往異境",
      "同學質疑後投票選出最適格的探險隊"
    ],
    "controlRule": "求生版抽道具或職業來求生；冒險版組成探險隊，比較誰最適合前往異境。",
    "image": "../assets/backgrounds/modes/item-survival.webp",
    "cardHooks": [
      "請說明「{name}」在異境「{異境}」中，可以如何創造優勢。",
      "比較「{name}」和其他選項，為什麼它在「{異境}」中值得保留？"
    ],
    "statusRules": {
      "default": "抽出一個異境，再抽道具或職業，說明如何生存、合作或對抗。",
      "survival": "求生版：抽出一個異境，再抽道具或職業，說明如何生存、合作或對抗。",
      "survival_no_environment": "無異境：只抽道具或職業，直接提出可行用途、限制與優勢。",
      "battle": "冒險版：將有多組探險隊，選擇不同的卡片，比較哪一組最適合前往。"
    },
    "menuLabel": "生存 × 冒險",
    "palette": "red"
  },
  {
    "id": "reality-summon",
    "order": 2,
    "title": "現實召喚",
    "icon": "✦",
    "tone": "violet",
    "track": "召喚 × 現實任務",
    "primaryDeck": "summons",
    "secondaryDeck": "missions",
    "primaryLabel": "召喚卡",
    "secondaryLabel": "任務卡",
    "drawLabel": "抽出召喚任務",
    "cardMode": "summonMission",
    "description": "召喚角色來現實世界，想出最合理又特別的方式完成專屬任務。",
    "prompts": [
      [
        "現實化",
        "思考角色在現實制度中怎麼開始行動。"
      ],
      [
        "辯護方案",
        "請用一個可被追問的計畫回答：第一步做什麼、找誰合作、如何證明有效。"
      ]
    ],
    "flow": [
      "選 1 到 6 張召喚卡，抽 1 張任務卡",
      "每位召喚師選一個角色提出現實方案",
      "誰最能把能力轉成現實中的成功策略"
    ],
    "image": "../assets/backgrounds/modes/reality-summon.webp",
    "controlRule": "抽出角色與任務，說明角色在現實世界中如何完成挑戰。",
    "cardHooks": [
      "請說明「{角色}」在任務「{任務}」時該怎麼做。",
      "別忘了「{角色}」是在現實世界中完成「{任務}」。"
    ],
    "statusRules": {
      "default": "召喚一個角色或能力，說明角色在現實制度中如何完成挑戰。",
      "summon": "先抽任務，再召喚角色，把超現實能力轉成可辯護的現實方案。"
    },
    "menuLabel": "召喚 × 任務",
    "palette": "purple"
  },
  {
    "id": "importance-duel",
    "order": 3,
    "title": "誰更重要",
    "icon": "VS",
    "tone": "gold",
    "track": "卡牌 × 卡牌",
    "primaryDeck": "celebrities",
    "secondaryDeck": "",
    "primaryLabel": "比較卡",
    "secondaryLabel": "",
    "defaultRarities": {
      "celebrities": [
        "A",
        "B",
        "C"
      ]
    },
    "drawLabel": "抽出對決卡牌",
    "cardMode": "importanceDuel",
    "fixedCount": 2,
    "description": "紅角與藍角各選一個牌池，抽出兩張卡牌跨類別比較誰更重要。",
    "prompts": [
      [
        "建立標準",
        "要用什麼標準比較重要性？影響力、實用性、稀缺性、急迫性、創造力、貢獻度？"
      ],
      [
        "正反互攻",
        "支持 A 的人要指出 B 的限制；支持 B 的人也要反擊 A 的弱點。"
      ],
      [
        "重新定義",
        "如果標準改變，結果會不會翻盤？"
      ]
    ],
    "flow": [
      "紅角與藍角各選一個要比較的詞庫",
      "兩邊各抽 1 張卡牌",
      "左右兩方各 30 秒建立標準",
      "互相質疑一次",
      "觀眾投票：誰的比較標準更合理"
    ],
    "controlRule": "抽出兩張或多張卡牌，建立比較標準，說服大家誰更重要。",
    "image": "../assets/backgrounds/modes/importance-duel.webp",
    "cardHooks": [
      "建立比較標準，說明 {name} 為什麼更重要。",
      "指出另一張卡牌相較於 {name} 的限制。",
      "如果比較標準改變，說明 {name} 是否仍有優勢。"
    ],
    "statusRules": {
      "default": "抽出兩張卡牌，建立比較標準，說服大家誰更重要。",
      "duel": "紅角與藍角各選一個牌池，再抽出卡牌進行跨卡池比較。"
    },
    "menuLabel": "卡牌 × 比較",
    "palette": "gold"
  },
  {
    "id": "sales-command",
    "order": 4,
    "title": "銷售密令",
    "icon": "$",
    "tone": "gold",
    "track": "供需 × 故事 × 目標",
    "primaryDeck": "items",
    "secondaryDeck": "needs",
    "primaryLabel": "物品卡",
    "secondaryLabel": "需求卡",
    "defaultRarities": {
      "items": [
        "N"
      ]
    },
    "drawLabel": "抽出銷售題目",
    "cardMode": "salesPitch",
    "salesAudienceDecks": [
      "creatures",
      "roles",
      "celebrities",
      "summons"
    ],
    "description": "向我賣出一支筆？把產品加諸故事或價值，讓他人意識到內在的需求。",
    "prompts": [
      [
        "需求洞察",
        "這個商品解決的是方便、安全、面子、紀念、效率、陪伴，還是其他需求？"
      ],
      [
        "目標客群",
        "誰最可能需要它？請說明年齡、情境、痛點與購買理由。"
      ],
      [
        "故事包裝",
        "如果不能只介紹功能，你要怎麼用故事讓它變得值得買？"
      ]
    ],
    "flow": [
      "選擇供需版、故事版或目標版",
      "供需版先抽需求，再抽商品",
      "故事版先抽概念或勾選無概念，再抽商品",
      "目標版先抽目標，再抽商品",
      "參與者提問：價格、替代品、可信度與真實需求"
    ],
    "controlRule": "抽出商品與需求，找出目標對象，包裝成一個有說服力的銷售故事。",
    "image": "../assets/backgrounds/modes/sales-command.webp",
    "cardHooks": [
      "說明 {name} 滿足哪一種需求。",
      "找出最可能購買 {name} 的對象。",
      "包裝一個讓人願意掏錢買 {name} 的故事。"
    ],
    "statusRules": {
      "default": "切換供需、故事或目標，練習把平凡商品說成值得購買的選擇。",
      "supply": "供需版：將商品對應到抽出的需求，說明產品如何滿足客戶的專屬需求。",
      "story": "故事版：將商品對應到抽出的需求，替商品鋪陳一個有記憶點的故事。",
      "story_no_concept": "無概念：只抽商品，把平凡物品包裝成有畫面感的故事。",
      "target": "目標版：先抽目標，再抽商品，判斷產品該怎麼賣給不同客戶。",
      "target_creatures": "目標版：把商品賣給動物，找出牠們可能在意的需求。",
      "target_roles": "目標版：把商品賣給不同職業，對準工作情境與痛點。",
      "target_celebrities": "目標版：把商品賣給名人，結合他的身分、經歷與公眾形象設計賣點。",
      "target_summons": "目標版：把商品賣給召喚異族，從陌生文化或能力限制找賣點。"
    },
    "menuLabel": "供需 × 故事 × 目標",
    "palette": "brown"
  },
  {
    "id": "metaphor-compass",
    "order": 5,
    "title": "隱喻羅盤",
    "icon": "◇",
    "tone": "cosmos",
    "track": "比喻 × 關係 × 命題",
    "primaryDeck": "concepts",
    "secondaryDeck": "relations",
    "metaphorConcreteDecks": [
      "items",
      "creatures"
    ],
    "metaphorDecks": [
      "concepts",
      "needs"
    ],
    "primaryLabel": "概念卡",
    "secondaryLabel": "關係卡",
    "drawLabel": "抽出隱喻命題",
    "cardMode": "metaphorCompass",
    "fixedCount": 2,
    "description": "論述語言關聯性，具體、抽象及自由版可供挑戰。",
    "prompts": [
      [
        "入門比喻",
        "人生版：人生和這個後綴詞哪裡像？"
      ],
      [
        "進階命題",
        "抽象版：這兩個詞中間的關係為什麼成立？"
      ]
    ],
    "flow": [
      "選擇人生版或抽象版",
      "人生版固定從人生子池抽「人生」與「就像」，只抽物品或動物作為後綴",
      "抽象版抽前綴、關係卡與後綴，組成「A 關係 C」命題",
      "30 秒找相似點或定義兩端詞語",
      "可鎖定前綴、介係或後綴，再重抽其他位置練習變化"
    ],
    "controlRule": "抽出詞語與關係，組成一句命題，解釋為什麼這個關係可以成立。",
    "image": "../assets/backgrounds/modes/metaphor-compass.webp",
    "cardHooks": [
      "定義 {name} 在這句命題中的意思。",
      "替 {name} 找一個具體例子。"
    ],
    "statusRules": {
      "default": "抽出詞語與關係，組成一句命題，解釋為什麼這個關係可以成立。",
      "concrete": "人生版：「人生就像⋯⋯」。",
      "abstract": "抽象版：抽出前綴、關係與後綴，解釋抽象命題為什麼成立。"
    },
    "menuLabel": "比喻 × 命題",
    "palette": "earth"
  },
  {
    "id": "where-am-i",
    "order": 6,
    "title": "推理解密",
    "icon": "?",
    "tone": "cosmos",
    "track": "秘密詞條",
    "image": "../assets/backgrounds/modes/where-am-i.webp",
    "primaryDeck": "locations",
    "secondaryDeck": "",
    "primaryLabel": "任意詞庫",
    "secondaryLabel": "",
    "drawLabel": "開啟秘密選號",
    "cardMode": "secretPlace",
    "fixedCount": 1,
    "description": "所有卡片都被編號，請靠是非題推理出關鍵機密。",
    "prompts": [
      [
        "是非提問",
        "先不急著猜答案，先問五道可判斷特徵的問題。"
      ],
      [
        "揭秘回覆",
        "揭秘者可以回答：是、不是、不一定、多數時候是⋯⋯"
      ],
      [
        "最後公布",
        "先輸入秘密編號，再逐一點選候選詞條，公布不是這個或就是這個。"
      ]
    ],
    "flow": [
      "選定本局詞庫與候選範圍",
      "輸入秘密編號，必要時勾選顯示編號確認",
      "參與者輪流問問題",
      "揭秘者只給有限回答",
      "累積線索後開放猜測",
      "點選候選詞條公布結果"
    ],
    "controlRule": "先秘密選定答案，再讓學生用問題逐步縮小範圍並推理答案。",
    "cardHooks": [
      "觀察 {name} 可能透露的環境線索。",
      "設計一個能排除或確認 {name} 的問題。",
      "思考哪些提問能最快縮小到 {name}。"
    ],
    "statusRules": {
      "default": "選定任一詞庫作為秘密答案池，輸入編號後讓學生用問題推理。"
    },
    "menuLabel": "秘密 × 線索",
    "palette": "purple"
  },
  {
    "id": "card-dictionary",
    "order": 999,
    "title": "卡片字典",
    "icon": "□",
    "tone": "sky",
    "track": "自由組合",
    "primaryDeck": "items",
    "secondaryDeck": "",
    "primaryLabel": "所有卡池",
    "secondaryLabel": "",
    "drawLabel": "儲存成這場",
    "cardMode": "cardDictionary",
    "description": "瀏覽目前所有卡片類型，勾選卡池後直接挑選本場要用的卡。",
    "prompts": [
      [
        "自由組合",
        "先選幾個卡池，再挑出本場要使用的卡，請學生把這些卡建立一個共同題目。"
      ],
      [
        "製造規則",
        "自行決定這些卡要用來比較、說故事、推理，還是辯護？"
      ],
      [
        "保留彈性",
        "卡片字典不限制玩法，適合臨時暖身、活動測試或創作新規則。"
      ]
    ],
    "flow": [
      "在左側清單查看所有卡池",
      "勾選本局想使用的卡片類型",
      "從各卡池中直接勾選本場卡牌",
      "可跨卡池加入或刪除卡牌",
      "按下儲存成這場，形成本局活動卡牌"
    ],
    "image": "../assets/backgrounds/modes/card-dictionary.webp",
    "statusRules": {
      "default": "先選卡池，再直接挑選本場要用的卡，組成自己的臨時活動。",
      "dictionary": "直接瀏覽所有卡池與卡牌，跨區挑選、刪除或儲存成這一場。"
    },
    "menuLabel": "卡片 × 組合",
    "palette": "cyan"
  }
];
