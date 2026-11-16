package javax.microedition.lcdui;
public class Display { static Display d=new Display(); public Displayable current; public static Display getDisplay(javax.microedition.midlet.MIDlet m){return d;} public void setCurrent(Displayable x){current=x;} public Displayable getCurrent(){return current;} }
