import { Injectable, signal, computed } from '@angular/core';

type Lang = 'th' | 'en';

const DICT: Record<string, { th: string; en: string }> = {
  'app.title':        { th: 'ระบบจัดการเบิกเครื่องเขียน',        en: 'Stationery Management System' },
  'app.tagline':      { th: 'ระบบเบิกจ่ายเครื่องเขียนสำหรับองค์กร', en: 'Enterprise stationery request platform' },
  'nav.dashboard':    { th: 'แดชบอร์ด',                            en: 'Dashboard' },
  'nav.catalog':      { th: 'แคตตาล็อกสินค้า',                    en: 'Stationery Catalog' },
  'nav.myRequests':   { th: 'คำขอของฉัน',                         en: 'My Requests' },
  'nav.approval':     { th: 'อนุมัติคำขอ',                        en: 'Approval' },
  'nav.warehouse':    { th: 'คลังสินค้า',                          en: 'Warehouse' },
  'nav.inventory':    { th: 'สต๊อกสินค้า',                        en: 'Inventory' },
  'nav.reports':      { th: 'รายงาน',                             en: 'Reports' },
  'nav.admin':        { th: 'ผู้ดูแลระบบ',                        en: 'Administration' },
  'nav.logout':       { th: 'ออกจากระบบ',                         en: 'Logout' },

  'login.heading':    { th: 'เข้าสู่ระบบด้วยอีเมลบริษัท',         en: 'Sign in with your company email' },
  'login.emailLabel': { th: 'อีเมลบริษัท',                        en: 'Company email' },
  'login.submit':     { th: 'เข้าสู่ระบบ',                        en: 'Sign in' },
  'login.hint':       { th: 'ตัวอย่างบัญชี:',                     en: 'Sample accounts:' },

  'dashboard.pending':   { th: 'รออนุมัติ',            en: 'Pending Approval' },
  'dashboard.preparing': { th: 'กำลังเตรียมของ',      en: 'Preparing' },
  'dashboard.ready':     { th: 'พร้อมให้รับ',         en: 'Ready for Pickup' },
  'dashboard.lowStock':  { th: 'สินค้าคงคลังต่ำ',      en: 'Low Stock' },
  'dashboard.monthTotal':{ th: 'ยอดใช้ 30 วัน',       en: '30-day Spend' },

  'catalog.search':   { th: 'ค้นหาชื่อ / SKU',        en: 'Search name / SKU' },
  'catalog.all':      { th: 'ทั้งหมด',                en: 'All' },
  'catalog.stock':    { th: 'คงเหลือ',                en: 'Stock' },
  'catalog.price':    { th: 'ราคา',                   en: 'Price' },
  'catalog.unit':     { th: 'หน่วย',                  en: 'Unit' },
  'catalog.add':      { th: 'เพิ่มลงคำขอ',           en: 'Add to request' },

  'req.createNew':    { th: 'สร้างคำขอใหม่',          en: 'Create request' },
  'req.no':           { th: 'เลขที่คำขอ',             en: 'Request No.' },
  'req.date':         { th: 'วันที่',                 en: 'Date' },
  'req.total':        { th: 'ยอดรวม',                 en: 'Total' },
  'req.status':       { th: 'สถานะ',                  en: 'Status' },
  'req.items':        { th: 'จำนวนรายการ',           en: 'Items' },
  'req.note':         { th: 'หมายเหตุ',              en: 'Note' },
  'req.submit':       { th: 'ส่งขออนุมัติ',          en: 'Submit' },
  'req.remove':       { th: 'ลบ',                     en: 'Remove' },
  'req.qty':          { th: 'จำนวน',                  en: 'Qty' },
  'req.pickupDate':   { th: 'วันรับของ',             en: 'Pickup date' },
  'req.pickupTime':   { th: 'เวลารับ',                en: 'Pickup time' },
  'req.pickupLoc':    { th: 'สถานที่รับ',            en: 'Pickup location' },
  'req.track':        { th: 'ติดตามสถานะ',           en: 'Track status' },
  'req.detail':       { th: 'รายละเอียด',            en: 'Detail' },
  'req.confirmPickup':{ th: 'ยืนยันการรับของ',      en: 'Confirm pickup' },
  'req.approve':      { th: 'อนุมัติ',                en: 'Approve' },
  'req.reject':       { th: 'ปฏิเสธ',                 en: 'Reject' },
  'req.reason':       { th: 'เหตุผล',                 en: 'Reason' },
  'req.prepare':      { th: 'ระบุวัน/เวลารับของ',    en: 'Set pickup schedule' },

  'wh.pickList':      { th: 'รายการที่ต้องจัดเตรียม', en: 'Pick List' },
  'wh.issue':         { th: 'จ่ายสินค้า',              en: 'Issue Items' },
  'wh.pickup':        { th: 'รอลูกค้ามารับ',          en: 'Pickup' },
  'wh.reservation':   { th: 'จองสินค้า',              en: 'Reservation' },

  'inv.stock':        { th: 'สต๊อกทั้งหมด',           en: 'All Stock' },
  'inv.receive':      { th: 'รับของเข้าคลัง',         en: 'Receive Stock' },
  'inv.adjust':       { th: 'ปรับปรุงสต๊อก',          en: 'Stock Adjustment' },
  'inv.transfer':     { th: 'โอนย้ายสต๊อก',           en: 'Stock Transfer' },
  'inv.count':        { th: 'ตรวจนับสต๊อก',           en: 'Stock Count' },
  'inv.low':          { th: 'สต๊อกต่ำ',                en: 'Low stock' },

  'rep.title':        { th: 'รายงานภาพรวม',           en: 'Executive Reports' },
  'rep.byCompany':    { th: 'ยอดเบิกตามบริษัท',       en: 'Spending by Company' },
  'rep.byDept':       { th: 'ยอดเบิกตามแผนก',         en: 'Spending by Department' },
  'rep.topItems':     { th: 'สินค้าที่ถูกเบิกสูงสุด',  en: 'Top Requested Items' },
  'rep.from':         { th: 'ตั้งแต่วันที่',           en: 'From' },
  'rep.to':           { th: 'ถึงวันที่',                en: 'To' },
  'rep.apply':        { th: 'แสดงผล',                  en: 'Apply' },

  'admin.users':      { th: 'จัดการผู้ใช้',            en: 'Users' },
  'admin.companies':  { th: 'บริษัท',                  en: 'Companies' },
  'admin.departments':{ th: 'แผนก',                    en: 'Departments' },
  'admin.items':      { th: 'สินค้า',                  en: 'Items' },
  'admin.categories': { th: 'หมวดหมู่',                en: 'Categories' },
  'admin.workflows':  { th: 'ขั้นตอนอนุมัติ',          en: 'Approval Workflow' },
  'admin.notifications': { th: 'การแจ้งเตือน',        en: 'Notifications' },
  'admin.settings':   { th: 'ตั้งค่าระบบ',             en: 'System Setting' },

  'common.save':      { th: 'บันทึก',                  en: 'Save' },
  'common.cancel':    { th: 'ยกเลิก',                  en: 'Cancel' },
  'common.close':     { th: 'ปิด',                     en: 'Close' },
  'common.confirm':   { th: 'ยืนยัน',                  en: 'Confirm' },
  'common.actions':   { th: 'การจัดการ',              en: 'Actions' },
  'common.name':      { th: 'ชื่อ',                    en: 'Name' },
  'common.email':     { th: 'อีเมล',                   en: 'Email' },
  'common.role':      { th: 'ตำแหน่ง',                 en: 'Role' },
  'common.company':   { th: 'บริษัท',                  en: 'Company' },
  'common.department':{ th: 'แผนก',                    en: 'Department' },
  'common.category':  { th: 'หมวดหมู่',                en: 'Category' },
  'common.sku':       { th: 'รหัสสินค้า',             en: 'SKU' },
  'common.item':      { th: 'สินค้า',                  en: 'Item' },
  'common.total':     { th: 'รวม',                     en: 'Total' },
  'common.baht':      { th: 'บาท',                     en: 'THB' },
  'common.requester': { th: 'ผู้เบิก',                 en: 'Requester' },
  'common.loading':   { th: 'กำลังโหลด…',             en: 'Loading…' },
  'common.empty':     { th: 'ไม่พบข้อมูล',            en: 'No data' },
  'common.back':      { th: 'ย้อนกลับ',                en: 'Back' },
  'common.newQty':    { th: 'จำนวนใหม่',              en: 'New Qty' },
  'common.reference': { th: 'เลขที่อ้างอิง',          en: 'Reference' },
  'common.location':  { th: 'สถานที่ปลายทาง',        en: 'Destination' },

  'status.PendingApproval': { th: 'รออนุมัติ',        en: 'Pending Approval' },
  'status.Approved':        { th: 'อนุมัติแล้ว',       en: 'Approved' },
  'status.Rejected':        { th: 'ถูกปฏิเสธ',        en: 'Rejected' },
  'status.Preparing':       { th: 'กำลังเตรียม',      en: 'Preparing' },
  'status.ReadyForPickup':  { th: 'พร้อมให้รับ',      en: 'Ready for Pickup' },
  'status.Completed':       { th: 'เสร็จสิ้น',         en: 'Completed' },
  'status.Cancelled':       { th: 'ยกเลิก',            en: 'Cancelled' },
  'status.Draft':           { th: 'ฉบับร่าง',          en: 'Draft' },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly key = 'sms.lang';
  lang = signal<Lang>(this.load());

  private load(): Lang {
    const v = localStorage.getItem(this.key);
    return v === 'en' ? 'en' : 'th';
  }
  toggle() {
    const next: Lang = this.lang() === 'th' ? 'en' : 'th';
    this.lang.set(next);
    localStorage.setItem(this.key, next);
    document.documentElement.setAttribute('lang', next);
  }
  t = computed(() => {
    const lang = this.lang();
    return (key: string) => DICT[key]?.[lang] ?? key;
  });
}
