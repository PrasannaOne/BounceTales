package javax.microedition.media;
public interface Player { int UNREALIZED=100,REALIZED=200,PREFETCHED=300,STARTED=400,CLOSED=0;
  void close(); void deallocate(); Control getControl(String s); int getState(); void prefetch() throws MediaException; void setLoopCount(int n); void start() throws MediaException; void stop() throws MediaException; }
