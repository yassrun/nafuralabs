import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) notFound();

  return (
    <div className="relative z-[1] min-h-screen bg-transparent pt-[71px]">
      <header className="fixed top-0 z-50 flex h-[71px] w-full items-center bg-paper-solid/90 px-6 backdrop-blur-[2px]">
        <Link href="/" className="text-[16px] text-black" data-no-draw>
          ← Retour
        </Link>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-8 text-4xl font-medium text-black">{project.title}</h1>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-200">
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <p className="mt-8 text-black/70">
          Étude de cas à venir — {project.title}. Conception, coordination et
          aménagement réunis sous une seule maîtrise d&apos;œuvre.
        </p>
      </article>
    </div>
  );
}
