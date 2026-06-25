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
    "drawLabel": "抽出求生組合",
    "cardMode": "itemEnvironment",
    "description": "先抽異境，再抽物品。學生要說明這個物品在該環境中如何救命、突破困境或製造優勢。",
    "prompts": [
      [
        "環境限制",
        "這個異境最麻煩的生存條件是什麼？"
      ],
      [
        "物品用途",
        "這個物品在此異境中至少能怎麼使用一次？"
      ],
      [
        "質疑挑戰",
        "其他人可以攻擊：不適用、太慢、太危險、資源不足。"
      ]
    ],
    "flow": [
      "抽 1 個異境",
      "抽 1 到 6 個物品",
      "每位學生 45 秒提出用途",
      "同學質疑後回應",
      "投票選出最有說服力的生存方案"
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
    ]
  },
  {
    "id": "where-am-i",
    "order": 4,
    "title": "我在哪裡",
    "icon": "?",
    "tone": "cosmos",
    "track": "秘密場地",
    "primaryDeck": "locations",
    "secondaryDeck": "",
    "primaryLabel": "場地卡",
    "secondaryLabel": "",
    "drawLabel": "秘密抽出場景",
    "cardMode": "secretPlace",
    "fixedCount": 1,
    "description": "系統先秘密抽出一個場地。學生只能用問題推理位置，最後老師往下滑公布答案。",
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
        "老師往下滑後公布原來在哪裡，再討論哪些問題最有效。"
      ]
    ],
    "flow": [
      "按下秘密抽場地",
      "學生輪流問問題",
      "教師只給有限回答",
      "累積線索後開放猜測",
      "往下滑公布答案"
    ]
  }
];
