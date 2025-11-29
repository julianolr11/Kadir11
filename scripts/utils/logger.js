/**
 * Sistema de logging com níveis para o Kadir11
 * @module utils/logger
 */

const isDev = process.env.NODE_ENV !== 'production';

class Logger {
    /**
     * @param {string} module - Nome do módulo (ex: 'main', 'petManager')
     */
    constructor(module) {
        this.module = module;
        this.enabled = true;
    }

    /**
     * Formata timestamp para log
     * @private
     */
    _timestamp() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    }

    /**
     * Formata mensagem de log
     * @private
     */
    _format(level, ...args) {
        return [`[${this._timestamp()}]`, `[${level}]`, `[${this.module}]`, ...args];
    }

    /**
     * Logs de debug (apenas em desenvolvimento)
     * @param {...any} args - Argumentos para logar
     */
    debug(...args) {
        if (isDev && this.enabled) {
            console.log(...this._format('DEBUG', ...args));
        }
    }

    /**
     * Logs informativos
     * @param {...any} args - Argumentos para logar
     */
    info(...args) {
        if (this.enabled) {
            console.log(...this._format('INFO', ...args));
        }
    }

    /**
     * Logs de aviso
     * @param {...any} args - Argumentos para logar
     */
    warn(...args) {
        if (this.enabled) {
            console.warn(...this._format('WARN', ...args));
        }
    }

    /**
     * Logs de erro (sempre exibidos)
     * @param {...any} args - Argumentos para logar
     */
    error(...args) {
        console.error(...this._format('ERROR', ...args));
    }

    /**
     * Desabilita logs deste logger
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Habilita logs deste logger
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Cria um grupo de logs (collapsable no DevTools)
     * @param {string} label - Label do grupo
     */
    group(label) {
        if (this.enabled) {
            console.group(...this._format('GROUP', label));
        }
    }

    /**
     * Finaliza grupo de logs
     */
    groupEnd() {
        if (this.enabled) {
            console.groupEnd();
        }
    }

    /**
     * Log de performance (mede tempo de execução)
     * @param {string} label - Label da medição
     * @returns {Function} Função para finalizar medição
     */
    time(label) {
        const start = performance.now();
        return () => {
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            this.debug(`⏱️ ${label}: ${duration}ms`);
        };
    }
}

/**
 * Cria uma instância de logger para um módulo
 * @param {string} module - Nome do módulo
 * @returns {Logger}
 */
function createLogger(module) {
    return new Logger(module);
}

module.exports = { Logger, createLogger };
