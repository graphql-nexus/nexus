import esbuild from 'esbuild'
import path from 'path'
import vm from 'vm'
import fs from 'fs'

describe('standalone esm', () => {
  it('should build the esbuild', async () => {
    const out = await esbuild.build({
      bundle: true,
      format: 'esm',
      target: 'esnext',
      minify: true,
      mainFields: ['module', 'main'],
      external: ['path', 'fs', 'prettier'],
      entryPoints: [path.join(__dirname, 'esm-entry.js')],
      outdir: path.join(__dirname, 'out'),
      outExtension: { '.js': '.mjs' },
      metafile: true,
      // write: false,
    })

    const context = vm.createContext()
    // @ts-ignore
    const outPath = path.join(__dirname, 'out', 'esm-entry.mjs')
    fs.writeFileSync(path.join(path.dirname(outPath), 'meta.json'), JSON.stringify(out.metafile))
    const script = new vm.Script(fs.readFileSync(outPath, 'utf8'), {
      filename: outPath,
    })
    script.runInNewContext(context)
  })
})
