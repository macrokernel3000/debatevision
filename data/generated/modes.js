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
    "description": "在異境中該如何生存？說服大家或與他人對抗計劃。",
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
      "選擇求生版或對抗版",
      "求生版抽 1 個異境，再抽道具或職業",
      "對抗版設定組數、每組道具數、每組職業數",
      "對抗版所有組別共用同一個異境，但各組拿到不同資源包",
      "各組上台說明：我們有哪些道具、有哪些職業夥伴、如何生存",
      "同學質疑後投票選出最有說服力的生存方案"
    ],
    "controlRule": "抽出一個異境，再抽道具或職業，說明如何生存、合作或對抗。",
    "image": "../assets/backgrounds/modes/item-survival.webp",
    "cardHooks": [
      "請說明「{name}」在異境「{異境}」中，可以如何創造生存優勢。",
      "比較「{name}」和其他選項，為什麼它在「{異境}」中值得保留？"
    ],
    "menuLabel": "生存 × 對抗",
    "palette": "red"
  },
  {
    "id": "role-survival",
    "order": 2,
    "title": "存席辯護",
    "icon": "◉",
    "tone": "sky",
    "track": "職業辯護",
    "primaryDeck": "roles",
    "secondaryDeck": "",
    "primaryLabel": "職業卡",
    "secondaryLabel": "",
    "drawLabel": "抽出辯護身份",
    "cardMode": "roleDefense",
    "description": "請說服大家哪個職業是最值得和我們前往異境的夥伴。",
    "prompts": [
      [
        "留下理由",
        "你的職業夥伴有什麼不可替代價值？"
      ],
      [
        "比較標準",
        "觀眾要考量誰更能提高群體存活率。"
      ]
    ],
    "flow": [
      "抽 1 到 6 個職業",
      "每位職業準備自己的留下理由",
      "每人 45 秒辯護",
      "互相反駁或提問環節",
      "逐輪淘汰直到最後留下者"
    ],
    "controlRule": "抽出職業身份，為自己或隊友提出最值得留下的理由。",
    "image": "../assets/backgrounds/modes/role-survival.webp",
    "cardHooks": [
      "說明 {name} 的不可替代價值。",
      "說服大家留下 {name}效益最高。"
    ],
    "menuLabel": "職業 × 辯護",
    "palette": "teal"
  },
  {
    "id": "importance-duel",
    "order": 3,
    "title": "誰更重要",
    "icon": "VS",
    "tone": "gold",
    "track": "卡牌 × 卡牌",
    "primaryDeck": "celebrities",
    "availableDecks": [
      "celebrities",
      "items",
      "needs",
      "concepts",
      "worlds",
      "locations",
      "roles",
      "creatures"
    ],
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
    "description": "直接抽兩張卡牌進行比較。可以切換不同牌組。",
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
      "選定本局要比較的詞庫",
      "抽 2 張卡牌",
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
    "menuLabel": "卡牌 × 比較",
    "palette": "gold"
  },
  {
    "id": "sales-command",
    "order": 4,
    "title": "銷售密令",
    "icon": "$",
    "tone": "gold",
    "track": "需求 × 故事",
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
    "description": "向我賣出一支筆？快找出需求、產品與故事，把平凡加諸價值，讓他人意識到內在的需求。",
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
      "選擇商品、需求或商品加需求",
      "30 秒找出核心需求",
      "30 秒決定目標客群",
      "45 秒完成銷售提案",
      "參與者提問：價格、替代品、可信度"
    ],
    "controlRule": "抽出商品與需求，找出目標對象，包裝成一個有說服力的銷售故事。",
    "image": "../assets/backgrounds/modes/sales-command.webp",
    "cardHooks": [
      "說明 {name} 滿足哪一種需求。",
      "找出最可能購買 {name} 的對象。",
      "包裝一個讓人願意掏錢買 {name} 的故事。"
    ],
    "menuLabel": "需求 × 故事",
    "palette": "brown"
  },
  {
    "id": "where-am-i",
    "order": 5,
    "title": "推理解密",
    "icon": "?",
    "tone": "cosmos",
    "track": "秘密詞條",
    "image": "../assets/backgrounds/modes/where-am-i.webp",
    "primaryDeck": "locations",
    "availableDecks": [
      "locations",
      "worlds",
      "items",
      "needs",
      "roles",
      "creatures",
      "celebrities"
    ],
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
    "menuLabel": "秘密 × 線索",
    "palette": "purple"
  },
  {
    "id": "metaphor-compass",
    "order": 6,
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
    "metaphorFreeDecks": [
      "worlds",
      "creatures",
      "items",
      "roles",
      "locations",
      "celebrities",
      "needs",
      "concepts"
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
        "具體版：人生和這個後綴詞哪裡像？"
      ],
      [
        "進階命題",
        "抽象版：這兩個詞中間的關係為什麼成立？"
      ]
    ],
    "flow": [
      "選擇具體版、抽象版或自由版",
      "具體版固定「人生就像⋯⋯」，只抽物品或動物作為後綴",
      "抽象版抽前綴、關係卡與後綴，組成「A 關係 C」命題",
      "自由版前綴與後綴可選任意詞庫，中間維持關係卡",
      "30 秒找相似點或定義兩端詞語",
      "可鎖定前綴、介係或後綴，再重抽其他位置練習變化"
    ],
    "controlRule": "抽出詞語與關係，組成一句命題，解釋為什麼這個關係可以成立。",
    "image": "../assets/backgrounds/modes/metaphor-compass.webp",
    "cardHooks": [
      "定義 {name} 在這句命題中的意思。",
      "替 {name} 找一個具體例子。"
    ],
    "menuLabel": "比喻 × 命題",
    "palette": "earth"
  },
  {
    "id": "reality-summon",
    "order": 7,
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
    "menuLabel": "召喚 × 任務",
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
    "description": "瀏覽目前所有卡片類型，勾選卡池後直接挑選本場要用的卡，讓老師自由發明活動。",
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
    "menuLabel": "卡片 × 組合",
    "palette": "cyan"
  }
];
