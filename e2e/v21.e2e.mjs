// New interaction and persistence checks; run by test:e2e in a real Chromium installation.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.argv[2] || 'http://127.0.0.1:4315/urban-haven/';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try {
 await page.goto(base+'#/garden');
 await page.getByRole('combobox',{name:'Growing space',exact:true}).selectOption('indoor');
 await page.getByRole('combobox',{name:'Main goal',exact:true}).selectOption('calories');
 assert.equal(await page.getByRole('combobox',{name:'Vegetable / herb',exact:true}).isDisabled(),true);
 await page.goto(base+'#/meals');
 await page.getByRole('heading',{name:'Buy the essentials first'}).waitFor();
 await page.getByRole('combobox',{name:'Food group',exact:true}).selectOption('canned-beans-lentils');
 assert.match(await page.locator('main').innerText(),/2–5 years/);
 await page.goto(base+'#/cooking');
 await page.getByRole('combobox',{name:'Recipe type',exact:true}).selectOption('vegetarian');
 assert.ok(await page.getByRole('combobox',{name:'Choose a recipe',exact:true}).locator('option').count()>=5);
 await page.goto(base+'#/health');
 await page.getByRole('combobox',{name:'Main health concern',exact:true}).waitFor();
 assert.equal(await page.getByRole('combobox',{name:'Main health concern',exact:true}).locator('option').count(),10);
 await page.goto(base+'#/radio');
 await page.getByRole('searchbox',{name:'Town, station or frequency',exact:true}).fill('Detroit');
 const station=page.locator('.station-card').filter({hasText:'KEC63'});
 await station.getByRole('button',{name:/^Save /}).click();
 await station.getByRole('button',{name:/^Unsave /}).waitFor();
 await page.reload();await page.getByRole('searchbox',{name:'Town, station or frequency',exact:true}).fill('Detroit');
 await page.locator('.station-card').filter({hasText:'KEC63'}).getByRole('button',{name:/^Unsave /}).waitFor();
 await page.goto(base+'#/pets');
 await page.getByRole('textbox',{name:'Pet name',exact:true}).fill('Example pet');
 await page.getByRole('spinbutton',{name:/Usual food per day/}).fill('200');
 await page.getByRole('spinbutton',{name:/Planned drinking water per day/}).fill('1');
 await page.getByRole('button',{name:'Save pet record',exact:true}).click();
 await page.getByText('Pet record saved on this device.',{exact:true}).waitFor();
 await page.getByRole('checkbox',{name:/14-day normal food supply/}).check();
 await page.waitForFunction(()=>document.querySelector('.pet-kit input')?.disabled===false);
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('main input[required]')?.value==='Example pet');
 assert.match(await page.locator('main').innerText(),/2.80 kg food; 14.00 L drinking water/);
 await page.goto(base+'#/map');
 await page.locator('.map-canvas').waitFor();
 for(const [name,coords] of [['Example start','42, -84'],['Example farm','42.1, -84']]) {
  await page.getByRole('button',{name:'At map center / by coordinates',exact:true}).click();
  await page.getByRole('textbox',{name:'Name',exact:true}).fill(name);
  await page.getByRole('textbox',{name:/Coordinates \(latitude, longitude\)/}).fill(coords);
  if(name==='Example farm') {
   await page.getByRole('combobox',{name:'Type',exact:true}).selectOption('farm');
   await page.locator('input[type=file]').setInputFiles({name:'example.png',mimeType:'image/png',buffer:readFileSync('public/icons/icon-192.png')});
   await page.getByRole('img',{name:'Marker photo preview',exact:true}).waitFor();
  }
  await page.getByRole('button',{name:'Save marker',exact:true}).click();
  await page.getByRole('heading',{name,exact:true}).waitFor();
  await page.getByRole('combobox',{name:'Add a saved marker',exact:true}).selectOption({label:name});
  await page.getByRole('button',{name:'Add marker to path',exact:true}).click();
  await page.getByRole('checkbox',{name:new RegExp(name+'$')}).waitFor();
 }
 await page.reload();
 await page.getByRole('checkbox',{name:'2. Example farm',exact:true}).waitFor();
 assert.match(await page.locator('.route-planner').innerText(),/11.12 km/);
 await page.getByRole('button',{name:'Reverse order',exact:true}).click();
 await page.getByRole('checkbox',{name:'1. Example farm',exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'no horizontal page overflow');
 console.log('PASS v2.1 dropdowns, radio and pet persistence, two-stop paths, local photo and mobile width');
} finally {await context.close();await browser.close();}
