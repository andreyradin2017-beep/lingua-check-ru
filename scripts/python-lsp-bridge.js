import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import path from 'node:path';
import fs from 'node:fs';

class PythonLSPBridge {
    constructor(projectRoot, pythonPath) {
        this.projectRoot = projectRoot;
        this.pythonPath = pythonPath;
        this.lspProcess = null;
        this.requestId = 1;
        this.callbacks = new Map();
        this.rl = null;
    }

    async start() {
        console.log(`[Python LSP] Запуск Pyright в ${this.projectRoot}...`);
        
        // Pyright устанавливается как исполняемый файл через pip
        // В Windows это Scripts/pyright.exe
        const binPath = path.join(path.dirname(this.pythonPath), 'pyright-langserver.exe');
        
        this.lspProcess = spawn(binPath, ['--stdio'], {
            cwd: this.projectRoot,
            shell: true
        });

        this.rl = createInterface({
            input: this.lspProcess.stdout,
            terminal: false
        });

        this.rl.on('line', (line) => {
            this.handleResponse(line);
        });

        // Инициализация LSP
        await this.sendRequest('initialize', {
            processId: process.pid,
            rootUri: `file:///${this.projectRoot.replace(/\\/g, '/')}`,
            capabilities: {
                textDocument: {
                    definition: { dynamicRegistration: true },
                    references: { dynamicRegistration: true }
                }
            }
        });

        await this.sendNotification('initialized', {});
        console.log('[Python LSP] Pyright готов.');
    }

    sendRequest(method, params) {
        const id = this.requestId++;
        const request = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };

        const content = JSON.stringify(request);
        const header = `Content-Length: ${Buffer.byteLength(content, 'utf8')}\r\n\r\n`;
        
        return new Promise((resolve, reject) => {
            this.callbacks.set(id, { resolve, reject });
            this.lspProcess.stdin.write(header + content);
        });
    }

    sendNotification(method, params) {
        const notification = {
            jsonrpc: '2.0',
            method,
            params
        };

        const content = JSON.stringify(notification);
        const header = `Content-Length: ${Buffer.byteLength(content, 'utf8')}\r\n\r\n`;
        this.lspProcess.stdin.write(header + content);
    }

    handleResponse(line) {
        if (line.startsWith('Content-Length:')) return;
        if (line.trim() === '') return;

        try {
            const response = JSON.parse(line);
            if (response.id && this.callbacks.has(response.id)) {
                const { resolve } = this.callbacks.get(response.id);
                this.callbacks.delete(response.id);
                resolve(response.result);
            }
        } catch (e) {}
    }

    async stop() {
        if (this.lspProcess) this.lspProcess.kill();
    }

    async findDefinition(filePath, line, character) {
        const uri = `file:///${path.resolve(filePath).replace(/\\/g, '/')}`;
        return await this.sendRequest('textDocument/definition', {
            textDocument: { uri },
            position: { line, character }
        });
    }

    async findReferences(filePath, line, character) {
        const uri = `file:///${path.resolve(filePath).replace(/\\/g, '/')}`;
        return await this.sendRequest('textDocument/references', {
            textDocument: { uri },
            position: { line, character },
            context: { includeDeclaration: true }
        });
    }
}

// Конфигурация для russian-lang
const projectRoot = 'd:/Template/russian-lang/backend';
const pythonPath = 'd:/Template/russian-lang/backend/.venv/Scripts/python.exe';

const bridge = new PythonLSPBridge(projectRoot, pythonPath);

const main = async () => {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log('Использование: node python-lsp-bridge.js [def|refs] [path] [line] [char]');
        process.exit(0);
    }

    await bridge.start();

    try {
        switch (command) {
            case 'def': {
                const [file, line, char] = args.slice(1);
                const res = await bridge.findDefinition(file, parseInt(line), parseInt(char));
                console.log(JSON.stringify(res, null, 2));
                break;
            }
            case 'refs': {
                const [file, line, char] = args.slice(1);
                const res = await bridge.findReferences(file, parseInt(line), parseInt(char));
                console.log(JSON.stringify(res, null, 2));
                break;
            }
        }
    } catch (e) {
        console.error(e);
    }

    await bridge.stop();
    process.exit(0);
};

main();
