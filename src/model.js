export const defaults = {
  title: 'ชุมสายพระโขนง', category: 'ชื่อพื้นที่ / PROPERTY', district: 'พระโขนง, กรุงเทพมหานคร',
  area: '2-2-77.00 ไร่', building: 'อาคาร คสล. เก่า (3ชั้น) พื้นที่รวม 2,270 ตรม. ว่างทั้งหลัง • อาคารชุมสายใหม่ 7 ชั้น พื้นที่รวม 6,780.88 ตรม. ว่าง ชั้น 4 พื้นที่ 925.5 ตรม. • รับ นน. 400-1,500 กก./ตรม.',
  electric: 'ระบบสายส่งผ่านหน้าที่ดิน 24 KV รองรับโหลดขนาดใหญ่', water: 'การประปานครหลวง • ปลอดน้ำท่วม มีระบบระบายน้ำล้อมรอบ',
  telecom: 'Fiber NT ถึงอาคาร • Carrier-neutral 2 เส้นทางหลัก', transport: '200 ม. จากสถานีรถไฟฟ้าอ่อนนุช • 350 ม. จากจุดขึ้นลงทางพิเศษฉลองรัช • 1.5 กม. จากจุดขึ้นลงทางพิเศษเฉลิมมหานคร',
  zoning: 'สีแดง (พาณิชยกรรม)', ownership: 'ทรัพย์สิน NT เลขที่โฉนด 8556 (พร้อมส่งมอบ)',
  price: 'อยู่ระหว่างการประเมินราคา / เปิดรับข้อเสนอร่วมลงทุน', lat: '13.707841', lng: '100.601377',
  points: 'ระยะห่างจาก BTS อ่อนนุชเพียง 200 เมตร อยู่ในระยะเดินเท้าที่สะดวกมาก\nใกล้ทางด่วน 2 สายหลัก (ฉลองรัช และเฉลิมมหานคร) ทำให้เชื่อมต่อเข้าศูนย์กลางเมืองหรือออกนอกเมืองได้ง่าย\nพร้อมใช้เป็น Data Center หรือพื้นที่ติดตั้งเครื่องจักร/อุปกรณ์น้ำหนักมากโดยไม่ต้องเสริมโครงสร้างใหม่',
  caveats: 'รูปทรงแปลงที่ดินแบบหน้าแคบ-ลึก\nการเข้าออกช่วงชั่วโมงเร่งด่วนอาจมีการจราจรหนาแน่นบริเวณถนนสุขุมวิท',
  tags: ['Potential location', 'Data center potential', 'Office', 'Other'],
  tagHighlights: [true, true, false, false],
  theme: 'corporate-yellow', density: 'normal',
  photo: '/assets/sample-satellite.jpg', photoFit: 'cover', photoPos: 'center',
  photo1: '/assets/sample-site-1.jpg', photo1Fit: 'cover',
  photo2: '/assets/sample-site-2.jpg', photo2Fit: 'cover',
  photo3: '/assets/sample-site-3.jpg', photo3Fit: 'cover',
  caption1: 'สภาพที่ดิน', caption2: 'สภาพแวดล้อม', caption3: 'ทางเข้า-ออก',
  logoPhoto: '', mapUrl: '', showDimensions: true,
  dimTop: 'หน้ากว้าง 34 ม.', dimBottom: 'กว้างหลัง 34 ม.',
  dimLeft: 'ลึก 100 ม.', dimRight: 'ลึก 100 ม.',
  slideLabels: {},
};
export const fields = [
  ['area','ขนาดพื้นที่','scan'], ['building','อาคารและสิ่งปลูกสร้าง','building-2'],
  ['electric','ระบบไฟฟ้า','zap'], ['water','ประปา / ระบบระบายน้ำ','droplets'],
  ['telecom','โครงข่ายโทรคมนาคม','wifi'], ['transport','การเดินทาง','train-front'],
  ['zoning','สีผังเมือง','map'], ['ownership','กรรมสิทธิ์','file-check-2'],
];
export function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function lines(value) { return String(value).split('\n').map(s => s.trim()).filter(Boolean); }
export function migrateLegacyPointCopy(data) {
  const legacy = {
    category: 'ที่ดินพร้อมอาคาร',
    building: 'อาคาร 3 ชั้น และอาคารชุมสาย 7 ชั้น',
    electric: 'ระบบสายส่ง 24 kV รองรับโหลดขนาดใหญ่', water: 'ประปานครหลวง พร้อมระบบระบายน้ำ',
    telecom: 'Fiber NT เข้าถึงอาคาร • 2 เส้นทางหลัก', transport: '200 ม. จาก BTS อ่อนนุช • ใกล้ทางด่วน 2 สาย',
    ownership: 'ทรัพย์สิน NT • โฉนดเลขที่ 8556', price: 'เปิดรับข้อเสนอร่วมลงทุน',
    points: 'เดินทางสะดวก ใกล้ BTS อ่อนนุชเพียง 200 เมตร\nเชื่อมต่อทางด่วนฉลองรัชและเฉลิมมหานคร\nมีโครงข่ายสื่อสารพร้อมต่อยอดธุรกิจ',
    caveats: 'แปลงที่ดินลักษณะหน้าแคบและลึก\nควรตรวจสอบการจราจรช่วงเวลาเร่งด่วน',
  };
  for (const key of Object.keys(legacy)) {
    if (typeof data[key] === 'string' && data[key].replace(/\r\n/g, '\n').trim() === legacy[key]) data[key] = defaults[key];
  }
}
export function validateData(data) {
  if (!data.title.trim()) return 'กรุณาระบุชื่อทรัพย์สิน';
  if (!data.lat.trim() || !data.lng.trim() || !Number.isFinite(Number(data.lat)) || !Number.isFinite(Number(data.lng)) || Math.abs(Number(data.lat)) > 90 || Math.abs(Number(data.lng)) > 180) return 'กรุณาระบุพิกัดละติจูดและลองจิจูดให้ถูกต้อง';
  return '';
}
