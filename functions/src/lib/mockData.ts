import { Exercise, WorkoutMenu } from '@/types/workout';

// Mock exercise database organized by body parts
const exerciseDatabase: Record<string, Exercise[]> = {
  chest: [
    {
      id: 'pushup',
      name: 'プッシュアップ',
      sets: 3,
      reps: 10,
      restTime: 60,
      difficulty: 2,
      instructions: [
        '手を肩幅に開いて床につきます',
        'つま先を床につけて体を一直線に保ちます',
        '胸を床に近づけるようにゆっくりと下ろします',
        '胸の筋肉を使って元の位置に戻します'
      ],
      tips: [
        '背筋を真っ直ぐに保つことを意識しましょう',
        '呼吸を止めずに、下ろす時に息を吸い、上げる時に息を吐きます',
        '肘を90度以上曲げることで効果が高まります'
      ],
      targetMuscles: ['大胸筋', '三角筋前部', '上腕三頭筋'],
      imageUrl: '/images/exercises/pushup.jpg'
    },
    {
      id: 'diamond-pushup',
      name: 'ダイヤモンドプッシュアップ',
      sets: 2,
      reps: 8,
      restTime: 90,
      difficulty: 4,
      instructions: [
        '両手で菱形（ダイヤモンド）を作るように指を配置します',
        '胸の下に手を置き、体を一直線に保ちます',
        'ゆっくりと胸を手に近づけるように下ろします',
        '上腕三頭筋を意識しながら押し上げます'
      ],
      tips: [
        '通常のプッシュアップより難易度が高いため、膝つきから始めてもOK',
        '手首に負担がかかるため、痛みを感じたら中止してください',
        '上腕三頭筋にしっかりと効かせることを意識します'
      ],
      targetMuscles: ['上腕三頭筋', '大胸筋内側'],
      imageUrl: '/images/exercises/diamond-pushup.jpg'
    },
    {
      id: 'incline-pushup',
      name: 'インクラインプッシュアップ',
      sets: 3,
      reps: 12,
      restTime: 60,
      difficulty: 1,
      instructions: [
        '椅子や台などの高い場所に手をつきます',
        '足を地面につけて斜めの姿勢を作ります',
        '胸を台に近づけるように下ろします',
        '胸の筋肉を使って押し上げます'
      ],
      tips: [
        '初心者におすすめの胸部エクササイズです',
        '台が高いほど負荷が軽くなります',
        '慣れてきたら台を低くして負荷を上げましょう'
      ],
      targetMuscles: ['大胸筋上部', '三角筋'],
      imageUrl: '/images/exercises/incline-pushup.jpg'
    }
  ],
  
  abs: [
    {
      id: 'plank',
      name: 'プランク',
      sets: 3,
      reps: '30秒',
      restTime: 60,
      difficulty: 2,
      duration: 30,
      instructions: [
        '前腕を床につけ、肘は肩の真下に配置します',
        'つま先を床につけて体を持ち上げます',
        '頭からかかとまで一直線を保ちます',
        '腹筋に力を入れてこの姿勢をキープします'
      ],
      tips: [
        'お尻が上がったり下がったりしないよう注意',
        '呼吸を止めずに自然に呼吸を続けます',
        '最初は15秒から始めて徐々に時間を延ばしましょう'
      ],
      targetMuscles: ['腹直筋', '腹横筋', '脊柱起立筋'],
      imageUrl: '/images/exercises/plank.jpg'
    },
    {
      id: 'crunches',
      name: 'クランチ',
      sets: 3,
      reps: 15,
      restTime: 45,
      difficulty: 2,
      instructions: [
        '仰向けに寝て膝を90度に曲げます',
        '手は頭の後ろに軽く添えます',
        '腹筋を意識しながら上体を起こします',
        'ゆっくりと元の位置に戻します'
      ],
      tips: [
        '首に力を入れすぎないよう注意してください',
        '腹筋の収縮を意識してゆっくりと動作します',
        '呼吸は起き上がる時に息を吐きます'
      ],
      targetMuscles: ['腹直筋上部'],
      imageUrl: '/images/exercises/crunches.jpg'
    },
    {
      id: 'mountain-climber',
      name: 'マウンテンクライマー',
      sets: 3,
      reps: 20,
      restTime: 60,
      difficulty: 3,
      instructions: [
        'プランクの姿勢から始めます',
        '右膝を胸に向かって引き寄せます',
        '右足を元に戻しながら左膝を胸に引き寄せます',
        'この動作を交互に素早く繰り返します'
      ],
      tips: [
        '体幹を安定させて腰が左右にブレないよう注意',
        'リズミカルに動作を行いましょう',
        '有酸素運動の効果も期待できます'
      ],
      targetMuscles: ['腹直筋', '腹斜筋', '股関節屈筋'],
      imageUrl: '/images/exercises/mountain-climber.jpg'
    }
  ],

  legs: [
    {
      id: 'squats',
      name: 'スクワット',
      sets: 3,
      reps: 15,
      restTime: 60,
      difficulty: 2,
      instructions: [
        '足を肩幅に開いて立ちます',
        '背筋を伸ばし、つま先は少し外向きに',
        'お尻を後ろに突き出すように腰を落とします',
        '太ももが床と平行になるまで下げます',
        'かかとで床を押すように立ち上がります'
      ],
      tips: [
        '膝がつま先より前に出ないよう注意',
        '背中を丸めず胸を張って行います',
        '下げる時に息を吸い、上がる時に息を吐きます'
      ],
      targetMuscles: ['大腿四頭筋', '大臀筋', 'ハムストリング'],
      imageUrl: '/images/exercises/squats.jpg'
    },
    {
      id: 'lunges',
      name: 'ランジ',
      sets: 2,
      reps: 10,
      restTime: 60,
      difficulty: 3,
      instructions: [
        '足を腰幅に開いて立ちます',
        '一歩大きく前に踏み出します',
        '後ろ足の膝が床に近づくまで腰を落とします',
        '前足で蹴るように元の位置に戻ります',
        '反対の足でも同様に行います'
      ],
      tips: [
        '上体は常に真っ直ぐに保ちます',
        '前膝がつま先より前に出ないよう注意',
        'バランスを取るのが難しい場合は壁に手をついてもOK'
      ],
      targetMuscles: ['大腿四頭筋', '大臀筋', 'ハムストリング'],
      imageUrl: '/images/exercises/lunges.jpg'
    },
    {
      id: 'calf-raises',
      name: 'カーフレイズ',
      sets: 3,
      reps: 20,
      restTime: 30,
      difficulty: 1,
      instructions: [
        '足を腰幅に開いて立ちます',
        'つま先で床を押してかかとを上げます',
        'ふくらはぎの収縮を感じながら最高点で1秒キープ',
        'ゆっくりとかかとを下ろします'
      ],
      tips: [
        'ふくらはぎの筋肉を意識して行います',
        '反動を使わずゆっくりとした動作で',
        '階段の段差を使うとより効果的です'
      ],
      targetMuscles: ['腓腹筋', 'ヒラメ筋'],
      imageUrl: '/images/exercises/calf-raises.jpg'
    }
  ],

  back: [
    {
      id: 'superman',
      name: 'スーパーマン',
      sets: 3,
      reps: 12,
      restTime: 45,
      difficulty: 2,
      instructions: [
        'うつ伏せになり、両手を前に伸ばします',
        '同時に胸と脚を床から持ち上げます',
        '背中の筋肉を意識して2秒間キープ',
        'ゆっくりと元の位置に戻します'
      ],
      tips: [
        '首に力を入れすぎないよう注意',
        '腰に痛みを感じたら動作を小さくします',
        '背中全体の筋肉を使うことを意識します'
      ],
      targetMuscles: ['脊柱起立筋', '大臀筋', 'ハムストリング'],
      imageUrl: '/images/exercises/superman.jpg'
    },
    {
      id: 'reverse-fly',
      name: 'リバースフライ',
      sets: 3,
      reps: 12,
      restTime: 60,
      difficulty: 2,
      instructions: [
        '足を腰幅に開き、軽く膝を曲げて前傾姿勢を取ります',
        '両腕を横に広げ、肩甲骨を寄せます',
        '背中の筋肉を意識して腕を後ろに引きます',
        'ゆっくりと元の位置に戻します'
      ],
      tips: [
        '肩甲骨を寄せることを強く意識します',
        '腕の力ではなく背中の筋肉を使います',
        '胸を張って背筋を伸ばします'
      ],
      targetMuscles: ['菱形筋', '中部僧帽筋', '後部三角筋'],
      imageUrl: '/images/exercises/reverse-fly.jpg'
    }
  ],

  shoulders: [
    {
      id: 'pike-pushup',
      name: 'パイクプッシュアップ',
      sets: 2,
      reps: 8,
      restTime: 90,
      difficulty: 4,
      instructions: [
        'ダウンドッグのポーズから始めます',
        '手は肩幅に開き、お尻を高く上げます',
        '頭を両手の間に下ろすように体を下げます',
        '肩の筋肉を使って押し上げます'
      ],
      tips: [
        '肩に集中的に効くエクササイズです',
        '頭を床につけないよう注意',
        '慣れるまでは浅い動作から始めましょう'
      ],
      targetMuscles: ['三角筋前部', '三角筋中部', '上腕三頭筋'],
      imageUrl: '/images/exercises/pike-pushup.jpg'
    },
    {
      id: 'lateral-raises',
      name: 'ラテラルレイズ',
      sets: 3,
      reps: 12,
      restTime: 45,
      difficulty: 2,
      instructions: [
        '足を腰幅に開いて立ちます',
        '両腕を体の横に垂らします',
        '肘を軽く曲げて腕を肩の高さまで上げます',
        'ゆっくりと元の位置に戻します'
      ],
      tips: [
        '肩の筋肉を意識して行います',
        '腕を上げすぎないよう注意（肩の高さまで）',
        '反動を使わずゆっくりとした動作で'
      ],
      targetMuscles: ['三角筋中部'],
      imageUrl: '/images/exercises/lateral-raises.jpg'
    }
  ],

  arms: [
    {
      id: 'tricep-dips',
      name: 'トライセップディップス',
      sets: 3,
      reps: 10,
      restTime: 60,
      difficulty: 3,
      instructions: [
        '椅子の端に手をつき、足を前に出します',
        'お尻を椅子から離して体重を腕で支えます',
        '肘を90度まで曲げて体を下げます',
        '上腕三頭筋を使って押し上げます'
      ],
      tips: [
        '肘は体に近づけて行います',
        '肩が上がらないよう注意',
        '膝を曲げると負荷が軽くなります'
      ],
      targetMuscles: ['上腕三頭筋', '前鋸筋'],
      imageUrl: '/images/exercises/tricep-dips.jpg'
    },
    {
      id: 'wall-handstand',
      name: '壁倒立プッシュアップ',
      sets: 2,
      reps: 5,
      restTime: 120,
      difficulty: 5,
      instructions: [
        '壁に向かって倒立の姿勢を取ります',
        '手は肩幅に開いて床につけます',
        '頭を床に近づけるように下ろします',
        '肩と腕の筋肉を使って押し上げます'
      ],
      tips: [
        '非常に高度なエクササイズです',
        '壁倒立ができない場合は練習から始めましょう',
        '安全のため、できる範囲で行ってください'
      ],
      targetMuscles: ['三角筋', '上腕三頭筋', '上腕二頭筋'],
      imageUrl: '/images/exercises/wall-handstand.jpg'
    }
  ],

  fullbody: [
    {
      id: 'burpees',
      name: 'バーピー',
      sets: 3,
      reps: 8,
      restTime: 90,
      difficulty: 4,
      instructions: [
        '立った状態から始めます',
        'しゃがんで両手を床につけます',
        '足を後ろに蹴ってプランクの姿勢になります',
        'プッシュアップを1回行います',
        '足を胸に引き寄せてしゃがみます',
        'ジャンプして立ち上がります'
      ],
      tips: [
        '全身を使う高強度エクササイズです',
        '慣れるまでは動作を分解して行いましょう',
        '心拍数が上がるため適度な休憩を取ります'
      ],
      targetMuscles: ['全身'],
      imageUrl: '/images/exercises/burpees.jpg'
    },
    {
      id: 'jumping-jacks',
      name: 'ジャンピングジャック',
      sets: 3,
      reps: 20,
      restTime: 30,
      difficulty: 2,
      instructions: [
        '足を揃えて立ち、両手は体の横に下ろします',
        'ジャンプして足を肩幅に開き、同時に両手を頭の上で合わせます',
        '再びジャンプして元の位置に戻ります',
        'リズミカルに繰り返します'
      ],
      tips: [
        '有酸素運動としても効果的です',
        'リズムよく跳ぶことを心がけます',
        '着地は足の前部分から行います'
      ],
      targetMuscles: ['全身', '心肺機能'],
      imageUrl: '/images/exercises/jumping-jacks.jpg'
    }
  ]
};

// Generate a workout menu based on selected body parts
export function generateWorkoutMenu(selectedBodyParts: string[]): WorkoutMenu {
  const exercises: Exercise[] = [];
  let totalDuration = 0;
  let totalCalories = 0;
  
  // For each selected body part, pick 2-3 exercises
  selectedBodyParts.forEach(bodyPart => {
    const availableExercises = exerciseDatabase[bodyPart] || [];
    // Randomly select 2-3 exercises for each body part
    const exerciseCount = Math.min(availableExercises.length, bodyPart === 'fullbody' ? 2 : 3);
    const selectedExercises = availableExercises
      .sort(() => 0.5 - Math.random())
      .slice(0, exerciseCount);
    
    exercises.push(...selectedExercises);
  });

  // Calculate totals
  exercises.forEach(exercise => {
    // Estimate time: (sets * (reps/duration + rest)) in minutes
    const exerciseTime = exercise.sets * (
      (exercise.duration ? exercise.duration : (typeof exercise.reps === 'number' ? exercise.reps * 3 : 30)) / 60 + 
      exercise.restTime / 60
    );
    totalDuration += exerciseTime;
    
    // Estimate calories: roughly 5-10 calories per minute based on difficulty
    totalCalories += exerciseTime * (3 + exercise.difficulty * 1.5);
  });

  const avgDifficulty = exercises.reduce((sum, ex) => sum + ex.difficulty, 0) / exercises.length;
  
  const bodyPartNames = selectedBodyParts.map(part => {
    const nameMap: Record<string, string> = {
      chest: '胸',
      back: '背中',
      shoulders: '肩',
      arms: '腕',
      abs: '腹',
      legs: '脚',
      fullbody: '全身'
    };
    return nameMap[part] || part;
  });

  return {
    id: `workout-${Date.now()}`,
    title: `${bodyPartNames.join('・')}トレーニング`,
    description: `AIが生成した${bodyPartNames.join('・')}に効果的なパーソナライズドワークアウトです。`,
    targetBodyParts: selectedBodyParts,
    exercises: exercises,
    totalDuration: Math.ceil(totalDuration),
    difficulty: Math.round(avgDifficulty),
    calories: Math.round(totalCalories),
    equipment: ['なし'], // bodyweight exercises
    createdAt: new Date()
  };
}

// Simulate AI generation with progress updates
export function simulateAIGeneration(
  selectedBodyParts: string[],
  onProgress: (progress: number, message: string) => void
): Promise<WorkoutMenu> {
  return new Promise((resolve) => {
    const messages = [
      'AIが最適なメニューを分析中...',
      'あなたの選択に基づいて運動を選定中...',
      '効果的な組み合わせを計算中...',
      'パーソナライズされたメニューを作成中...',
      'トレーニングプランを最終調整中...'
    ];
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      const messageIndex = Math.min(Math.floor(progress / 20) - 1, messages.length - 1);
      onProgress(progress, messages[messageIndex] || messages[messages.length - 1]);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const menu = generateWorkoutMenu(selectedBodyParts);
          resolve(menu);
        }, 500);
      }
    }, 800); // 800ms intervals for 4-second total
  });
}