const API_URL = "/api/v1";

function getHeaders(extraHeaders: any = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        ...extraHeaders,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

export async function fetchWithAuth(url: string, options: any = {}) {
    const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: getHeaders(options.headers),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }
    return res.json();
}

export async function fetchNextQuestion(topic_id?: number) {
    let url = `${API_URL}/learning/next`;
    if (topic_id) {
        url += `?topic_id=${topic_id}`;
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to fetch question');
    }
    return res.json();
}

export async function submitAnswer(response: { question_id: number, answer: string, time_taken: number }) {
    const res = await fetch(`${API_URL}/learning/submit`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(response),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to submit answer');
    }
    return res.json(); // Returns boolean is_correct
}

export async function analyzeState(data: { mood_score: number, stress_level: number, sleep_quality: number, focus_level: number }) {
    const res = await fetch(`${API_URL}/psychology/analyze`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to analyze state');
    return res.json();
}

export async function generateCustomQuiz(subject: string, topic: string) {
    const res = await fetch(`${API_URL}/learning/custom-quiz/generate`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ subject, topic }),
    });
    if (!res.ok) throw new Error('Failed to generate quiz');
    return res.json();
}

export async function downloadQuizReport(subject: string, topic: string, results: any[]) {
    const res = await fetch(`${API_URL}/learning/custom-quiz/report`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ subject, topic, results }),
    });
    if (!res.ok) throw new Error('Failed to download report');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quiz_report_${subject.toLowerCase().replace(/\\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export async function fetchChatHistory(sessionId: number) {
    const res = await fetch(`${API_URL}/learning/chat/history/${sessionId}`, {
        method: 'GET',
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
}

export async function fetchChatSessions() {
    const res = await fetch(`${API_URL}/learning/chat/sessions`, {
        method: 'GET',
        headers: getHeaders(),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to fetch chat sessions');
    }
    return res.json();
}


export async function detectEmotion(imageBase64: string) {
    const res = await fetch(`${API_URL}/ai/emotion`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ image: imageBase64 }),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to detect emotion');
    }
    return res.json();
}

export async function processVoice(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    const res = await fetch(`${API_URL}/ai/voice`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to process voice');
    }
    return res.json();
}

export async function generateQuizFromNotes(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/ai/vision/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to generate quiz from notes');
    }
    return res.json();
}

export async function fetchDueReviews() {
    const res = await fetch(`${API_URL}/learning/reviews/due`, {
        method: 'GET',
        headers: getHeaders(),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to fetch due reviews');
    }
    return res.json(); // Returns List[Question]
}

export async function submitReviewQuality(data: { content_item_id: number, quality: number }) {
    const res = await fetch(`${API_URL}/learning/reviews/submit`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to submit review quality');
    }
    return res.json(); // Returns boolean
}

export async function fetchStudentStats() {
    const res = await fetch(`${API_URL}/student/stats`, {
        method: 'GET',
        headers: getHeaders(),
    });
    if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized');
        throw new Error('Failed to fetch student stats');
    }
    return res.json();
}
