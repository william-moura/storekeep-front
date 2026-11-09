// src/app/core/interceptors/tenant.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const tenantInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // 1. Captura o hostname atual do navegador (ex: ://seuapp.com ou empresa1.localhost)
  const hostname = window.location.hostname;
  
  // 2. Define a porta ou rota padrão da sua API Laravel
  // Em produção, sua API pode rodar no mesmo domínio ou em um subdomínio específico (ex: ://empresa1.com)
  // Para ambiente de desenvolvimento local:
  const apiProtocol = window.location.protocol;
  const apiPort = '8080'; // Altere para a porta do seu Artisan se necessário
  
  let baseUrl = '';

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Tratamento para desenvolvimento local sem subdomínio configurado na máquina
    baseUrl = `${apiProtocol}//tenant1.localhost:${apiPort}`;
  } else {
    // Em produção ou com subdomínios configurados localmente (ex: empresa1.seuapp.test)
    baseUrl = `${apiProtocol}//${hostname}:${apiPort}`;
  }

  // 3. Se a requisição for uma rota relativa (ex: /api/products), intercepta e coloca a URL do Tenant
  if (req.url.startsWith('/api')) {
    const tenantRequest = req.clone({
      url: `${baseUrl}${req.url}`
    });
    return next(tenantRequest);
  }

  return next(req);
};
