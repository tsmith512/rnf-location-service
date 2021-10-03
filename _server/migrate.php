<?php

// Don't judge me for this. And definitely don't copy it.

// Set it, don't commit it.
$pass = 'PLACEHOLDER';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$db = new mysqli('localhost','maps', $pass,'maps_prod');

$loop = true;

while ($loop) {
  $startpoint_result = $db->query("SELECT MAX(timestamp) AS time FROM rnf_migration");
  $startpoint = $startpoint_result->fetch_array(MYSQLI_ASSOC);
  var_dump($startpoint);
  $start = $startpoint['time'] ?: 0;

  $source_result = $db->query("SELECT * FROM location_history WHERE time > $start ORDER BY time ASC LIMIT 1000");
  $rows = $source_result->fetch_all(MYSQLI_ASSOC);

  if (count($rows) === 0) {
    $loop = false;
    break;
  }

  foreach ($rows as $row) {
    if ($row['geocode_full_response']) {
      $geocode = unserialize($row['geocode_full_response']);

      $label = [];

      if ($geocode['countryCode'] !== 'US') {
        if ($geocode['regionCode']) {
          $label[] = $geocode['countryCode'];
        } else {
          $label[] = $geocode['country'];
        }
      }

      if ($geocode['regionCode']) {
        if ($geocode['city'] || $geocode['county']) {
          $label[] = $geocode['regionCode'];
        } else {
          $label[] = $geocode['region'];
        }
      }

      if (!$geocode['city'] && $geocode['county']) {
        $label[] = $geocode['county'];
      }

      if ($geocode['city']) {
        $label[] = $geocode['city'];
      }

      $label_string = implode(', ', array_reverse($label));
    }

    $waypoint = array(
      'id' => (int) $row['id'],
      'timestamp' => $row['time'],
      'point' => "POINT({$row['lon']} {$row['lat']})",
      'label' => ($label_string) ?: '',
      'state' => $geocode['region'] ?: '',
      'country' => $geocode['country'] ?: '',
      'geocode_attempts' => (int) $row['geocode_attempts'],
    );

    var_dump($waypoint);

    $sql = sprintf(
      'INSERT INTO rnf_migration (%s) VALUES ("%s")',
      implode(',',array_keys($waypoint)),
      implode('","',array_values($waypoint))
    );

    $insert = $db->query($sql);
  }
}
