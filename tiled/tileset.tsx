<?xml version="1.0" encoding="UTF-8"?>
<tileset name="tileset" tilewidth="16" tileheight="16" tilecount="256" columns="16">
 <image source="../static/tileset.png" width="256" height="256"/>
 <tile id="0" type="empty"/>
 <tile id="1" type="wall">
  <properties>
   <property name="description" value="This is a wall."/>
  </properties>
 </tile>
 <tile id="2" type="wall">
  <properties>
   <property name="description" value="This is a wall."/>
  </properties>
 </tile>
 <tile id="3" type="wall">
  <properties>
   <property name="description" value="This is a wall."/>
  </properties>
 </tile>
 <tile id="4" type="wall">
  <properties>
   <property name="description" value="This is a wall."/>
  </properties>
 </tile>
 <tile id="5" type="floor">
  <properties>
   <property name="description" value="This is a floor."/>
   <property name="maxsize" value="20"/>
  </properties>
 </tile>
 <tile id="6" type="floor">
  <properties>
   <property name="description" value="This is a floor."/>
   <property name="maxsize" value="20"/>
  </properties>
 </tile>
 <tile id="7" type="floor">
  <properties>
   <property name="description" value="This is a floor."/>
   <property name="maxsize" value="20"/>
  </properties>
 </tile>
 <tile id="8" type="floor">
  <properties>
   <property name="description" value="This is a floor."/>
   <property name="maxsize" value="20"/>
  </properties>
 </tile>
 <tile id="9" type="door"/>
 <tile id="10" type="dooropen"/>
 <tile id="11" type="doormechanised"/>
 <tile id="12" type="doormechanisedopen"/>
 <tile id="13" type="water">
  <properties>
   <property name="description" value="This is water."/>
   <property name="maxsize" value="20"/>
  </properties>
 </tile>
 <tile id="14" type="lava">
  <properties>
   <property name="damage" value="1000"/>
   <property name="description" value="This is lava."/>
   <property name="maxsize" value="20"/>
  </properties>
 </tile>
 <tile id="15" type="acid">
  <properties>
   <property name="damage" value="2"/>
   <property name="description" value="This is acid."/>
   <property name="maxsize" value="20"/>
  </properties>
 </tile>
 <tile id="25" type="doorbronzelocked">
  <properties>
   <property name="requireitem" value="keybronze"/>
   <property name="useractivationtext" value="You open door."/>
  </properties>
 </tile>
 <tile id="26" type="doorbronze">
  <properties>
   <property name="useractivationtext" value="You open door."/>
  </properties>
 </tile>
 <tile id="27" type="doorbronzeopen"/>
 <tile id="28" type="chest">
  <properties>
   <property name="useractivationtext" value="You open chest."/>
  </properties>
 </tile>
 <tile id="29" type="chestopen"/>
 <tile id="30" type="pentagram1"/>
 <tile id="31" type="pentagram2"/>
 <tile id="41" type="doorsilverlocked">
  <properties>
   <property name="requireitem" value="keysilver"/>
   <property name="useractivationtext" value="You unlock door."/>
  </properties>
 </tile>
 <tile id="42" type="doorsilver">
  <properties>
   <property name="useractivationtext" value="You open door."/>
  </properties>
 </tile>
 <tile id="43" type="doorsilveropen"/>
 <tile id="44" type="chestgold">
  <properties>
   <property name="useractivationtext" value="You open fancy chest."/>
  </properties>
 </tile>
 <tile id="45" type="chestgoldopen"/>
 <tile id="46" type="pentagram3"/>
 <tile id="47" type="pentagram4"/>
 <tile id="48" type="leverleft">
  <properties>
   <property name="activationtarget" value="[[0,0]]"/>
   <property name="useractivationtext" value="You pull the lever."/>
  </properties>
 </tile>
 <tile id="49" type="leverright">
  <properties>
   <property name="activationtarget" value="[[0,0]]"/>
   <property name="useractivationtext" value="You pull the lever."/>
  </properties>
 </tile>
 <tile id="50" type="pressureplate">
  <properties>
   <property name="activationtarget" value="[[0,0]]"/>
  </properties>
 </tile>
 <tile id="51" type="pillar"/>
 <tile id="52" type="statue"/>
 <tile id="53" type="tomb"/>
 <tile id="54" type="tombbroken"/>
 <tile id="55" type="doorbar"/>
 <tile id="56" type="doorbaropen"/>
 <tile id="57" type="doorgoldlocked">
  <properties>
   <property name="requireitem" value="keygold"/>
   <property name="useractivationtext" value="You unlock door."/>
  </properties>
 </tile>
 <tile id="58" type="doorgold">
  <properties>
   <property name="useractivationtext" value="You open door."/>
  </properties>
 </tile>
 <tile id="59" type="doorgoldopen"/>
 <tile id="64" type="rock"/>
 <tile id="66" type="pressureplatedown">
  <properties>
   <property name="activationtarget" value="[[0,0]]"/>
  </properties>
 </tile>
 <tile id="67" type="pedestal"/>
 <tile id="68" type="vase"/>
 <tile id="69" type="table"/>
 <tile id="70" type="tablebroken"/>
 <tile id="71" type="tablevertical"/>
 <tile id="72" type="rockpile"/>
 <tile id="73" type="skullpile"/>
 <tile id="74" type="statuebroken"/>
 <tile id="80" type="trapspike"/>
 <tile id="81" type="traspikeactivated"/>
 <tile id="82" type="trapteleportin"/>
 <tile id="83" type="trapteleportout"/>
 <tile id="96" type="tunnelleftright">
  <properties>
   <property name="description" value="This is part of a tunnel."/>
   <property name="maxsize" value="1"/>
  </properties>
 </tile>
 <tile id="97" type="tunnelbottomup">
  <properties>
   <property name="description" value="This is part of a tunnel."/>
   <property name="maxsize" value="1"/>
  </properties>
 </tile>
 <tile id="98" type="tunnelbottomright">
  <properties>
   <property name="description" value="This is part of a tunnel."/>
   <property name="maxsize" value="1"/>
  </properties>
 </tile>
 <tile id="99" type="tunnelbottomleft">
  <properties>
   <property name="description" value="This is part of a tunnel."/>
   <property name="maxsize" value="1"/>
  </properties>
 </tile>
 <tile id="112" type="tunnelentrance">
  <properties>
   <property name="description" value="This is part of a tunnel."/>
   <property name="maxsize" value="1"/>
  </properties>
 </tile>
 <tile id="114" type="tunnelupright">
  <properties>
   <property name="description" value="This is part of a tunnel."/>
   <property name="maxsize" value="1"/>
  </properties>
 </tile>
 <tile id="115" type="tunnelleftup">
  <properties>
   <property name="description" value="This is part of a tunnel."/>
   <property name="maxsize" value="1"/>
  </properties>
 </tile>
</tileset>
