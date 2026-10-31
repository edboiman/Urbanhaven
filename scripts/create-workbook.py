from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from pathlib import Path
c=canvas.Canvas('public/documents/readiness-workbook.pdf',pagesize=letter)
c.setTitle('Urban Haven - Household Readiness Workbook')
W,H=letter
green=HexColor('#234e3c'); muted=HexColor('#647267'); line=HexColor('#d5ddc9')
def header(kicker,title,page):
 c.setFillColor(green);c.rect(0,H-120,W,120,fill=1,stroke=0)
 c.setFillColor(HexColor('#d5dfc5'));c.setFont('Helvetica-Bold',9);c.drawString(42,H-40,kicker)
 c.setFillColor(HexColor('#fffdf2'));c.setFont('Times-Roman',29);c.drawString(42,H-83,title)
 c.setFillColor(muted);c.setFont('Helvetica',8);c.drawString(42,29,'URBAN HAVEN  /  FIELD EDITION 01  /  PERSONAL PLANNING WORKBOOK');c.drawRightString(W-42,29,str(page))
def label(text,y):
 c.setFillColor(green);c.setFont('Helvetica-Bold',12);c.drawString(42,y,text)
def row(text,y):
 c.setFillColor(muted);c.setFont('Helvetica',10);c.drawString(42,y,text)
 c.setStrokeColor(line);c.line(42,y-22,W-42,y-22)
def checkbox(text,y):
 c.setStrokeColor(green);c.rect(43,y-1,9,9);c.setFillColor(green);c.setFont('Helvetica',10);c.drawString(63,y,text)
header('PREPARED, AT YOUR PACE.','Your household, on one page.',1)
label('The people in your plan',H-155)
row('Household members / pets / additional support needs:',H-182)
row('Out-of-area contact - name and phone:',H-239)
row('Nearby contact - name and phone:',H-296)
row('Meeting place close to home:',H-353)
row('Meeting place outside your neighborhood:',H-410)
row('Safe relocation option / transport arrangements:',H-467)
row('Water shutoff / electrical panel location:',H-524)
row('Medication, medical equipment and refill backup plan:',H-581)
c.setFillColor(muted);c.setFont('Helvetica',9);c.drawString(42,85,'Keep a printed copy where you can find it. Protect personal contact and medical details.')
c.showPage()
header('SMALL STEPS. A CLEARER PLAN.','Before the next interruption.',2)
label('Check what is actually ready',H-156)
items=['Safe drinking water and containers; individual and pet needs reviewed.', 'Shelf-stable food you can eat; manual opener and dietary needs covered.', 'Tested battery lights, spare batteries and phone charging options.', 'First aid supplies and an individual medication / medical-equipment plan.', 'Soap, hygiene supplies and a locally appropriate emergency toilet plan.', 'Working smoke and carbon monoxide alarms; usable exit routes.', 'Local radio / alerts and printed contacts / household meeting plan.', 'Safe heated / cooled relocation option; assistance and transport arranged.']
y=H-188
for text in items: checkbox(text,y);y-=33
label('Test your offline companion',y-16);y-=49
for text in ['Open the published app online, then select Download & verify.', 'Wait for all core files to pass the local integrity check.', 'Install from Android Chrome; turn on airplane mode and close the app.', 'Reopen, search a guide, save a supply and open a stored PDF.', 'Restart your phone and repeat. Keep an exported backup separately.']:
 checkbox(text,y);y-=30
c.setFillColor(muted);c.setFont('Helvetica',9)
c.drawString(42,133,'Browser data can be cleared. This app does not guarantee safety or storage permanence.')
c.drawString(42,116,'For emergencies call 911 when available and follow current local official instructions.')
c.drawString(42,91,'Planning reference: ready.gov/kit and ready.gov/plan (checked October 31, 2026).')
c.save()
