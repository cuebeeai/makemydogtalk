export default function HelloSection() {
  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground lowercase">
          hello!
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Make My Dog Talk is a fun AI tool that turns your dog's photo into a 6-second video. 
          Just upload, describe what your dog should say or do, and let our AI bring it to life. 
          It's simple, playful, and perfect for sharing with friends and family!
        </p>
      </div>
    </section>
  );
}
