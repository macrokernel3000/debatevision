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
    "description": "每一個異境都潛藏危機，請告訴眾人，我們該如何脫離險境？",
    "prompts": [
      [
        "環境限制",
        "這個異境最令人擔憂的生存條件是什麼？"
      ],
      [
        "卡牌極限",
        "如果道具或職業能力看似強大，它的限制、代價或替代方案是什麼？"
      ],
      [
        "局部有效",
        "不是每一個道具都能讓我們能完整走到最後，但如果有一個很小卻明確的用途，那也令人讚賞。"
      ]
    ],
    "flow": [
      "選擇本局抽道具或職業，再抽 1 個異境",
      "思考異境特色及卡牌功能",
      "每位學生提出30 秒內容",
      "共同討論，分組合作"
    ],
    "image": "../assets/backgrounds/modes/item-survival.png",
    "cardHooks": [
      "提出 {name} 在這個異境中的一個用途。",
      "比較 {name} 與其他選擇的差異與優缺點"
    ]
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
    "description": "抽出一個或多個職業，請說服大家自己是最值得留下來的。",
    "prompts": [
      [
        "留下理由",
        "你的職業有什麼不可替代價值？"
      ],
      [
        "比較標準",
        "觀眾要考量誰更能提高群體存活率。"
      ],
      [
        "提示 3",
        "攻擊別人的理由時，要比較必要性、立即性、替代性。"
      ]
    ],
    "flow": [
      "抽 1 到 6 個職業",
      "每位學生準備自己的留下理由",
      "每人 45 秒辯護",
      "觀眾提問或互相反駁",
      "逐輪淘汰直到最後留下者"
    ],
    "image": "../assets/backgrounds/modes/role-survival.png",
    "cardHooks": [
      "說明 {name} 的不可替代價值。",
      "說服大家留下 {name}效益最高。"
    ]
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
    "description": "直接抽兩張卡牌進行比較。可以切換名人、物品、需求、概念、異境、場地、職業或生物。",
    "prompts": [
      [
        "建立標準",
        "你要用什麼標準比較重要性？影響力、實用性、稀缺性、急迫性、創造力、貢獻度？"
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
    "image": "../assets/backgrounds/modes/importance-duel.png",
    "cardHooks": [
      "建立比較標準，說明 {name} 為什麼更重要。",
      "指出另一張卡牌相較於 {name} 的限制。",
      "如果比較標準改變，說明 {name} 是否仍有優勢。"
    ]
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
      "同學提問：價格、替代品、可信度"
    ],
    "image": "../assets/backgrounds/modes/sales-command.png",
    "cardHooks": [
      "說明 {name} 滿足哪一種需求。",
      "找出最可能購買 {name} 的對象。",
      "包裝一個讓人願意掏錢買 {name} 的故事。"
    ]
  },
  {
    "id": "where-am-i",
    "order": 5,
    "title": "推理解密",
    "icon": "?",
    "tone": "cosmos",
    "track": "秘密詞條",
    "image": "../assets/backgrounds/modes/where-am-i.png",
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
        "只能提問",
        "學生不能直接猜答案，必須先問可判斷詞條特徵的問題。"
      ],
      [
        "教師回覆",
        "教師可以回答：是、不是、不一定、接近了。"
      ],
      [
        "最後公布",
        "先輸入秘密編號，再逐一點選候選詞條，公布不是這個或就是這個。"
      ]
    ],
    "flow": [
      "選定本局詞庫與候選範圍",
      "輸入秘密編號，必要時勾選顯示編號確認",
      "學生輪流問問題",
      "教師只給有限回答",
      "累積線索後開放猜測",
      "點選候選詞條公布結果"
    ],
    "cardHooks": [
      "觀察 {name} 可能透露的環境線索。",
      "設計一個能排除或確認 {name} 的問題。",
      "思考哪些提問能最快縮小到 {name}。"
    ]
  },
  {
    "id": "metaphor-compass",
    "order": 6,
    "title": "隱喻羅盤",
    "icon": "◇",
    "tone": "cosmos",
    "track": "概念 × 關係 × 概念",
    "primaryDeck": "concepts",
    "secondaryDeck": "relations",
    "metaphorDecks": [
      "concepts",
      "needs"
    ],
    "primaryLabel": "概念卡",
    "secondaryLabel": "關係卡",
    "drawLabel": "抽出隱喻命題",
    "cardMode": "metaphorCompass",
    "fixedCount": 2,
    "description": "前綴與後綴可以選擇概念卡或需求卡，再搭配一張關係卡，組成一句看似奇怪卻值得辯護的隱喻命題。",
    "prompts": [
      [
        "重新定義",
        "先解釋兩個概念在這句話中各自代表什麼。"
      ],
      [
        "找到角度",
        "不要只證明字面相等，而是找到能讓關係成立的比較角度。"
      ]
    ],
    "flow": [
      "選擇前綴與後綴要使用概念卡或需求卡",
      "抽出前綴、關係卡與後綴",
      "組成「A 關係 C」命題",
      "30 秒定義兩端詞語",
      "45 秒提出一個可成立的解釋角度",
      "可鎖定前綴、介係或後綴，再重抽其他位置練習變化"
    ],
    "image": "../assets/backgrounds/modes/metaphor-compass.png",
    "cardHooks": [
      "定義 {name} 在這句命題中的意思。",
      "替 {name} 找一個具體例子。"
    ]
  }
];
