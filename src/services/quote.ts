// 每日一言服务 - 混合策略：优先 API，失败回退到本地精选

interface Quote {
  text: string
  author: string
}

// 精选科学/学术中文名言（保底数据池）
const LOCAL_QUOTES: Quote[] = [
  { text: '科学的灵感，绝不是坐等可以等来的。', author: '华罗庚' },
  { text: '学问是经验的积累，才能是刻苦的忍耐。', author: '茅以升' },
  { text: '在科学上最好的助手是自己的头脑，而不是别的东西。', author: '法布尔' },
  { text: '科学的每一项巨大成就，都是以大胆的幻想为出发点的。', author: '杜威' },
  { text: '科学的界限就像地平线一样，你越接近它，它挪得越远。', author: '布埃斯特' },
  { text: '真理的大海，让未发现的一切事物躺卧在我的眼前，任我去探寻。', author: '牛顿' },
  { text: '科学不是为了个人荣誉，不是为了私利，而是为人类谋幸福。', author: '钱三强' },
  { text: '科学始终是不公道的。如果它不提出十个问题，你就永远不能解决一个问题。', author: '萧伯纳' },
  { text: '科学技术是第一生产力。', author: '邓小平' },
  { text: '科学没有国界，科学家却有国界。', author: '巴甫洛夫' },
  { text: '科学是使人精神变得勇敢的最好途径。', author: '布鲁诺' },
  { text: '在科学上，没有平坦的大道，只有不畏劳苦沿着陡峭山路攀登的人。', author: '马克思' },
  { text: '科学尊重事实，服从真理，而不会屈服于任何压力。', author: '童第周' },
  { text: '科学的永恒性就在于坚持不懈地寻求之中，科学就其容量而言，是不枯竭的，就其目标而言，是永远不可企及的。', author: '卡·冯·伯尔' },
  { text: '灵感不过是顽强的劳动而获得的奖赏。', author: '列宾' },
  { text: '我之所以能在科学上成功，最重要的一点就是对科学的热爱，坚持长期探索。', author: '达尔文' },
  { text: '科学给予人类最大的礼物是什么？是使人类相信真理的力量。', author: '康普顿' },
  { text: '科学地探求真理，要求我们的理智永远不要狂热地坚持某种假设。', author: '莫洛亚' },
]

interface QuotableResponse {
  _id: string
  content: string
  author: string
}

// 获取一言。优先 API，失败回退本地
export async function fetchQuote(): Promise<Quote> {
  try {
    const res = await fetch(
      'https://api.quotable.io/quotes/random?tags=science|wisdom|technology&maxLength=120',
      { signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) throw new Error('API unavailable')
    const data: QuotableResponse[] = await res.json()
    if (data?.length > 0) {
      return { text: data[0].content, author: data[0].author }
    }
    throw new Error('empty')
  } catch {
    const dayIndex = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    ) % LOCAL_QUOTES.length
    return LOCAL_QUOTES[dayIndex]
  }
}

// 本地随机一言
export function getRandomQuote(): Quote {
  return LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)]
}
