import './style.css'

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const keyStatusEl = document.getElementById('key-status')
const messagesEl = document.getElementById('messages')
const form = document.getElementById('chat-form')
const input = document.getElementById('user-input')
const sendBtn = document.getElementById('send-btn')
const clearBtn = document.getElementById('clear-btn')

const systemPrompt = `당신은 따뜻하고 친절한 연말 분위기의 저녁 메뉴 추천 도우미입니다. 추천 이유와 간단한 조리 팁(또는 대체 재료), 필요한 시간(대략)을 포함해 친절하게 알려주세요.`

// chatHistory: 첫 항목은 항상 system 메시지
let chatHistory = [ { role: 'system', content: systemPrompt } ]

// 최대 보관 메시지 수 (system 제외)
const MAX_HISTORY_MESSAGES = 12

function trimHistory() {
  // 유지할 길이 = 1 (system) + MAX_HISTORY_MESSAGES
  const maxLen = 1 + MAX_HISTORY_MESSAGES
  if (chatHistory.length > maxLen) {
    // 자르기: keep system + last N
    const head = chatHistory.slice(0, 1)
    const tail = chatHistory.slice(chatHistory.length - MAX_HISTORY_MESSAGES)
    chatHistory = head.concat(tail)
  }
}

function addMessage(text, who = 'bot') {
  const li = document.createElement('li')
  li.className = `message ${who}`
  li.innerText = text
  messagesEl.appendChild(li)
  messagesEl.scrollTop = messagesEl.scrollHeight
}

async function testApiKey() {
  if (!API_KEY) {
    keyStatusEl.innerText = 'API Key 없음 (환경변수 VITE_OPENAI_API_KEY 확인)'
    keyStatusEl.style.color = '#f3a6a6'
    return
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: '안녕' } ],
        max_tokens: 1,
      }),
    })

    if (res.ok) {
      keyStatusEl.innerText = 'API Key 정상 작동 ✔'
      keyStatusEl.style.color = '#cfead9'
    } else {
      const txt = await res.text()
      keyStatusEl.innerText = 'API Key 오류 — 응답 확인 필요'
      console.error('Key test failed:', res.status, txt)
      keyStatusEl.style.color = '#f3a6a6'
    }
  } catch (err) {
    keyStatusEl.innerText = 'API 요청 실패 — 네트워크 확인'
    keyStatusEl.style.color = '#f3a6a6'
    console.error(err)
  }
}

async function sendToOpenAI(userText) {
  if (!API_KEY) {
    addMessage('API Key가 설정되어 있지 않습니다. VITE_OPENAI_API_KEY를 확인하세요.', 'bot')
    return
  }

  // 사용자 메시지 추가
  chatHistory.push({ role: 'user', content: userText })
  trimHistory()

  // UI에 로딩 플레이스홀더 추가
  addMessage('추천을 생성하고 있어요... 잠시만 기다려 주세요.', 'bot')

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: chatHistory,
        temperature: 0.8,
        max_tokens: 400,
      }),
    })

    // remove the '생성 중' placeholder (the last bot message)
    const placeholders = messagesEl.querySelectorAll('.message.bot')
    if (placeholders.length) {
      const last = placeholders[placeholders.length - 1]
      if (last && last.innerText.includes('생성')) last.remove()
    }

    if (!resp.ok) {
      const errText = await resp.text()
      addMessage('추천 생성 중 오류가 발생했습니다. 콘솔을 확인하세요.', 'bot')
      console.error('OpenAI error', resp.status, errText)
      return
    }

    const data = await resp.json()
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    if (content) {
      addMessage(content.trim(), 'bot')
      // assistant 메시지로 기록
      chatHistory.push({ role: 'assistant', content: content.trim() })
      trimHistory()
    } else addMessage('응답을 받지 못했습니다.', 'bot')

  } catch (err) {
    addMessage('요청 중 오류가 발생했습니다. 네트워크를 확인하세요.', 'bot')
    console.error(err)
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text) return
  addMessage(text, 'user')
  input.value = ''
  await sendToOpenAI(text)
})

clearBtn.addEventListener('click', () => {
  messagesEl.innerHTML = ''
  // reset history to only system prompt and initial assistant message
  chatHistory = [ { role: 'system', content: systemPrompt } ]
  const welcome = '안녕하세요 — 포근한 연말 분위기로 저녁 메뉴를 추천해드릴게요. 재료나 취향을 알려주세요!'
  addMessage(welcome, 'bot')
  chatHistory.push({ role: 'assistant', content: welcome })
})

// 초기 안내 메시지
const welcome = '안녕하세요 — 포근한 연말 분위기로 저녁 메뉴를 추천해드릴게요. 재료나 취향을 알려주세요!'
addMessage(welcome, 'bot')
chatHistory.push({ role: 'assistant', content: welcome })

// 테스트: API Key가 있을 경우 짧은 요청으로 정상 여부 확인
testApiKey()
