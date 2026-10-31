// Supabase 프로젝트 설정 화면의 Project URL과 Publishable key를 아래 따옴표 안에 붙여 넣으세요.
const SUPABASE_URL = "https://vgpvrxdjofbdcfzvhgyp.supabase.co/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qPkwaem6FPpyKAX_8I1yRQ_alebVsRy";

// 브라우저에서 사용할 Supabase 클라이언트입니다. secret/service_role 키는 사용하지 마세요.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
