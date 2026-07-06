window.DEBATE_MODES = [
  {
    "id": "item-survival",
    "order": 1,
    "title": "異境求生",
    "icon": "◆",
    "tone": "danger",
    "track": "異境 × 物品",
    "primaryDeck": "items",
    "secondaryDeck": "worlds",
    "primaryLabel": "物品卡",
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
    "description": "每一個異境都潛藏危機，請用抽出的道具告訴眾人，我們該如何脫離險境？",
    "prompts": [
      [
        "環境限制",
        "這個異境最令人擔憂的生存條件是什麼？"
      ],
      [
        "物品極限",
        "如果物品是永久使用，確實可以降低難度，但如果道具有數量限制或壽命極限呢？"
      ],
      [
        "局部有效",
        "不是每一個道具都能讓我們能完整走到最後，但如果有一個很小卻明確的用途，那也令人讚賞。"
      ]
    ],
    "flow": [
      "選 1 到 6 個物品，抽1個異境",
      "思考異境特色及物品功能",
      "每位學生提出30 秒內容",
      "共同討論，分組合作"
    ],
    "image": "../assets/backgrounds/modes/item-survival.png",
    "cardHooks": [
      "提出 {name} 在這個異境中的一個救命用途。",
      "說明 {name} 在此環境中的限制與補救。",
      "回應一個同學對 {name} 的質疑。"
    ]
  },
  {
    "id": "role-survival",
    "order": 2,
    "title": "存席辯護",
    "icon": "◉",
    "tone": "sky",
    "track": "異境 × 職業",
    "primaryDeck": "roles",
    "secondaryDeck": "worlds",
    "primaryLabel": "職業卡",
    "secondaryLabel": "異境卡",
    "drawLabel": "抽出留席戰場",
    "cardMode": "roleEnvironment",
    "description": "同一個危機異境中，每位學生抽職業，說服大家自己最值得留下來。",
    "prompts": [
      [
        "留下理由",
        "你的職業在這個環境中有什麼不可替代價值？"
      ],
      [
        "比較標準",
        "觀眾不是投喜歡誰，而是投誰更能提高群體存活率。"
      ],
      [
        "反駁方向",
        "攻擊別人的理由時，要比較必要性、立即性、替代性。"
      ]
    ],
    "flow": [
      "抽 1 個異境",
      "每位學生抽 1 個職業",
      "每人 45 秒辯護",
      "觀眾提問或互相反駁",
      "逐輪淘汰直到最後留下者"
    ],
    "image": "../assets/backgrounds/modes/role-survival.png",
    "cardHooks": [
      "說明 {name} 在這個異境中的不可替代價值。",
      "承認 {name} 的一個弱點，並提出化解方式。",
      "用一句話說服大家留下 {name}。"
    ]
  },
  {
    "id": "importance-duel",
    "order": 3,
    "title": "誰更重要",
    "icon": "VS",
    "tone": "gold",
    "track": "物品 × 物品",
    "primaryDeck": "items",
    "secondaryDeck": "",
    "primaryLabel": "物品卡",
    "secondaryLabel": "",
    "defaultRarities": {
      "items": [
        "A",
        "B",
        "C"
      ]
    },
    "drawLabel": "抽出對決物品",
    "cardMode": "importanceDuel",
    "fixedCount": 2,
    "description": "刻意不給場景，直接抽兩個物品。學生要建立比較標準，說明誰更重要。",
    "prompts": [
      [
        "建立標準",
        "你要用什麼標準比較重要性？生存、交換、長期、短期？"
      ],
      [
        "正反互攻",
        "支持 A 的人要指出 B 的限制；支持 B 的人也要反擊 A。"
      ],
      [
        "重新定義",
        "如果標準改變，結果會不會翻盤？"
      ]
    ],
    "flow": [
      "抽 2 個物品",
      "左右兩方各 30 秒建立標準",
      "互相質疑一次",
      "觀眾投票：誰的比較標準更合理"
    ],
    "image": "../assets/backgrounds/modes/importance-duel.png",
    "cardHooks": [
      "建立比較標準，說明 {name} 為什麼更重要。",
      "指出另一件物品相較於 {name} 的限制。",
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
    "secondaryDeck": "",
    "primaryLabel": "物品卡",
    "secondaryLabel": "",
    "defaultRarities": {
      "items": [
        "N"
      ]
    },
    "drawLabel": "抽出銷售商品",
    "cardMode": "salesPitch",
    "description": "學生抽出一個普通商品，先判斷它滿足什麼需求，再決定賣給誰，最後包裝成有說服力的銷售故事。",
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
      "抽 1 到 6 張物品卡商品",
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
    "title": "我在哪裡",
    "icon": "?",
    "tone": "cosmos",
    "track": "秘密場地",
    "image": "../assets/backgrounds/modes/where-am-i.png",
    "primaryDeck": "locations",
    "secondaryDeck": "",
    "primaryLabel": "場地卡",
    "secondaryLabel": "",
    "drawLabel": "選定藏身處",
    "cardMode": "secretPlace",
    "fixedCount": 1,
    "description": "系統列出本局啟用的場地編號，用隱藏輸入設定答案。學生從候選位置中提問推理，最後公布結果。",
    "prompts": [
      [
        "只能提問",
        "學生不能直接猜答案，必須先問可判斷場地特徵的問題。"
      ],
      [
        "教師回覆",
        "教師可以回答：是、不是、不一定、接近了。"
      ],
      [
        "最後公布",
        "先輸入秘密編號，再逐一點選候選位置，公布不是這裡或就是這裡。"
      ]
    ],
    "flow": [
      "輸入秘密編號，必要時勾選顯示編號確認",
      "學生輪流問問題",
      "教師只給有限回答",
      "累積線索後開放猜測",
      "點選候選位置公布結果"
    ],
    "cardHooks": [
      "觀察 {name} 可能透露的環境線索。",
      "設計一個能排除或確認 {name} 的問題。",
      "思考哪些提問能最快縮小到 {name}。"
    ]
  }
];
