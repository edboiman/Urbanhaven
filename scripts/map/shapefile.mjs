// Minimal ESRI shapefile reader (PolyLine = 3, Polygon = 5) with a dBASE III attribute reader.
// Enough for Natural Earth / Census TIGER line & polygon layers. Coordinates must be WGS84 lon/lat.
import { readFile } from "node:fs/promises";
export async function readShapefile(base) {
  const shp = await readFile(base + ".shp");
  const dbf = await readFile(base + ".dbf");
  const records = readDbf(dbf);
  const features = [];
  let offset = 100;
  let i = 0;
  while (offset < shp.length) {
    const contentLength = shp.readInt32BE(offset + 4) * 2;
    const type = shp.readInt32LE(offset + 8);
    const start = offset + 8;
    if (type === 3 || type === 5) {
      const numParts = shp.readInt32LE(start + 36);
      const numPoints = shp.readInt32LE(start + 40);
      const partsAt = start + 44;
      const pointsAt = partsAt + numParts * 4;
      const parts = [];
      for (let p = 0; p < numParts; p++) parts.push(shp.readInt32LE(partsAt + p * 4));
      parts.push(numPoints);
      const rings = [];
      for (let p = 0; p < numParts; p++) {
        const ring = [];
        for (let k = parts[p]; k < parts[p + 1]; k++)
          ring.push([shp.readDoubleLE(pointsAt + k * 16), shp.readDoubleLE(pointsAt + k * 16 + 8)]);
        rings.push(ring);
      }
      features.push({
        properties: records[i] || {},
        geometry: type === 3 ? { type: "MultiLineString", coordinates: rings } : { type: "PolygonRings", coordinates: rings },
      });
    }
    offset = start + contentLength;
    i++;
  }
  return features;
}
function readDbf(buf) {
  const count = buf.readUInt32LE(4);
  const headerLength = buf.readUInt16LE(8);
  const recordLength = buf.readUInt16LE(10);
  const fields = [];
  for (let o = 32; buf[o] !== 0x0d; o += 32) {
    const name = buf.toString("latin1", o, o + 11).replace(/\0.*$/, "");
    fields.push({ name, type: String.fromCharCode(buf[o + 11]), length: buf[o + 16] });
  }
  const out = [];
  for (let r = 0; r < count; r++) {
    const at = headerLength + r * recordLength + 1;
    const row = {};
    let o = at;
    for (const f of fields) {
      const raw = buf.toString("utf8", o, o + f.length).trim();
      row[f.name] = f.type === "N" || f.type === "F" ? (raw === "" ? null : Number(raw)) : raw;
      o += f.length;
    }
    out.push(row);
  }
  return out;
}
