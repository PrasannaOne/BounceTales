package javax.microedition.rms;
import java.util.*;
public class RecordStore { static Map<String,RecordStore> all=new HashMap<>(); List<byte[]> recs=new ArrayList<>();
  public static RecordStore openRecordStore(String n,boolean c) throws RecordStoreException { RecordStore r=all.get(n); if(r==null){ if(!c) throw new RecordStoreException("none"); r=new RecordStore(); all.put(n,r);} return r; }
  public int addRecord(byte[] d,int o,int l){ recs.add(Arrays.copyOfRange(d,o,o+l)); return recs.size(); }
  public void setRecord(int id,byte[] d,int o,int l){ recs.set(id-1,Arrays.copyOfRange(d,o,o+l)); }
  public byte[] getRecord(int id){ return recs.get(id-1); } public int getNumRecords(){return recs.size();} public void closeRecordStore(){} }
