import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * El cuerpo de una nota, escrito en Markdown por el admin.
 *
 * `react-markdown` **no** renderiza HTML crudo salvo que se le agregue
 * `rehype-raw`, y no se le agrega a propósito: eso es lo que hace que el texto
 * que escribe el admin no pueda inyectar marcado en la página. Si alguna vez
 * hace falta HTML dentro de una nota, la respuesta no es habilitar `rehype-raw`
 * sino sanitizar.
 *
 * Los estilos van por `components` y no por una clase de tipografía: el
 * proyecto no usa el plugin de prosa de Tailwind, y esto deja cada elemento con
 * la misma escala que el resto del sitio.
 */
export function PostBody({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-brand-700">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-8 text-xl font-bold text-brand-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 text-lg font-bold text-brand-900">{children}</h3>
          ),
          p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">{children}</ol>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-brand-900">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gold-300 pl-4 text-sm italic text-brand-600">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-semibold text-gold-700 underline hover:text-gold-800"
              // Un enlace externo escrito en una nota no debería poder tocar la
              // pestaña de origen.
              {...(href?.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-brand-200" />,
          code: ({ children }) => (
            <code className="rounded bg-brand-100 px-1.5 py-0.5 text-xs text-brand-800">
              {children}
            </code>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
