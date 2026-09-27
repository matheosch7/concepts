import numpy as np, wave
SR=48000; DUR=8.0; B=0.5; N=int(SR*DUR)
L=np.zeros(N); R=np.zeros(N)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); sig=sig[:max(0,N-i)]
    L[i:i+len(sig)]+=sig*g*(1-max(0,pan)); R[i:i+len(sig)]+=sig*g*(1+min(0,pan))
def load(name):
    w=wave.open(f'sfx/{name}.wav'); n=w.getnframes(); ch=w.getnchannels(); sw=w.getsampwidth(); fr=w.getframerate()
    a=np.frombuffer(w.readframes(n),dtype=np.int16 if sw==2 else np.int32).astype(float)/(32768 if sw==2 else 2**31)
    a=a.reshape(-1,ch).mean(1)
    if fr!=SR: a=np.interp(np.linspace(0,len(a)-1,int(len(a)*SR/fr)),np.arange(len(a)),a)
    return a
t=np.arange(int(0.45*SR))/SR
kick=np.sin(2*np.pi*(48*t+ (110/18)*(1-np.exp(-18*t))))*np.exp(-7*t)
rng=np.random.default_rng(3)
ct=np.arange(int(0.25*SR))/SR
clap=rng.standard_normal(len(ct))*np.exp(-22*ct)
clap=np.convolve(clap,np.ones(6)/6,'same')
roots=[55.0,55.0,43.65,49.0]  # A1 A1 F1 G1 per 2 s
for b in range(16):
    tb=b*B
    if tb<6.0 or tb>=6.5: add(kick,tb,0.9)
    if b%2==1: add(clap,tb,0.28)
    # offbeat filtered shaker, soft
    sh=rng.standard_normal(int(0.06*SR))*np.exp(-60*np.arange(int(0.06*SR))/SR)
    sh=np.convolve(sh,np.ones(3)/3,'same'); add(sh,tb+B/2,0.06,pan=0.3 if b%2 else -0.3)
    # sidechained sub bass on 8ths
    for k in range(2):
        tt=np.arange(int(0.22*SR))/SR; f=roots[int(tb//2)%4]
        bass=np.tanh(1.6*np.sin(2*np.pi*f*tt))*np.minimum(1,tt*60)*np.exp(-4*tt)
        add(bass,tb+k*B/2+0.03,0.32)
# pad chords (sawish, lowpassed by smoothing)
chords=[[220,277.2,329.6],[220,277.2,329.6],[174.6,220,261.6],[196,246.9,293.7]]
for c in range(4):
    tt=np.arange(int(2.0*SR))/SR; s=sum(np.sin(2*np.pi*f*tt)+0.3*np.sin(4*np.pi*f*tt) for f in chords[c])
    env=np.minimum(1,tt*8)*np.minimum(1,(2.0-tt)*8); duck=0.35+0.65*np.minimum(1,((tt%B)/0.18))
    add(s*env*duck/3,c*2.0,0.07)
# SFX on the motion
S={n:load(n) for n in ['boom','whoosh','whoosh2','swoosh','uipop','pop','click','impact','riser2','subdrop']}
add(S['boom'],0.0,0.5)
for tb in [0.5,0.75,1.0,1.25,1.5]: add(S['uipop'],tb,0.18,pan=0.4)
add(S['click'],1.95,0.4,pan=0.3)
add(S['whoosh'],2.1,0.55,pan=-0.5)
for i,tb in enumerate([2.75,3.25,3.75]): add(S['pop'],tb,0.35,pan=-0.2+0.3*i)
add(S['uipop'],4.0,0.35,pan=0.5)
add(S['whoosh2'],4.05,0.5)
for tb in [4.75,5.0,5.25,5.5]: add(S['pop'],tb,0.2,pan=0.4)
r=S['riser2']; add(r[-int(1.2*SR):],4.85,0.35)
add(S['swoosh'],5.9,0.5)
add(S['impact'],6.5,0.7); add(S['subdrop'],6.5,0.45)
for tb in [7.0,7.25,7.5]: add(S['uipop'],tb,0.2)
m=np.stack([L,R],1); m/= np.abs(m).max()/0.89
fo=int(0.05*SR); m[-fo:]*=np.linspace(1,0,fo)[:,None]
w=wave.open('renders/mix.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((m*32767).astype(np.int16).tobytes()); w.close()
