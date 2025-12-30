import { defineToolConfig, getRssItems } from '../utils';

export default defineToolConfig({
  name: 'get-vietnamnet-news',
  description: 'Lấy tin tức mới nhất từ VietNamNet - trang báo điện tử uy tín của Việt Nam, cung cấp tin tức về thời sự, kinh tế, xã hội, pháp luật, giáo dục, sức khỏe và du lịch',
  func: () => getRssItems('https://vietnamnet.vn/rss/home.rss'),
});
